#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri::menu::{MenuBuilder, SubmenuBuilder};
use tauri::webview::NewWindowResponse;
use tauri_plugin_opener::OpenerExt;

fn external_allowed(url: &tauri::Url) -> bool {
    url.scheme() == "https" && url.username().is_empty() && url.password().is_none()
        && url.port().is_none()
        && matches!(url.host_str(), Some("www.twitch.tv" | "twitch.tv" | "discord.gg"))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let file = SubmenuBuilder::new(app, "File")
                .text("open-entry", "Open entry link…")
                .separator().quit().build()?;
            let menu = MenuBuilder::new(app).item(&file).build()?;
            app.set_menu(menu)?;
            app.on_menu_event(|app, event| {
                if event.id().as_ref() == "open-entry" { let _ = app.emit("open-entry-link", ()); }
            });
            let new_window_app = app.handle().clone();
            let nav_app = app.handle().clone();
            let qa = std::env::args().any(|arg| arg == "--self-test")
                || std::env::var("ITEM_CODEX_QA").as_deref() == Ok("1");
            // Use logical work-area dimensions so taskbars and display scaling
            // cannot place the initial reading controls beyond the screen.
            let (width, height) = app.primary_monitor()?.map(|monitor| {
                let area = monitor.work_area();
                let scale = monitor.scale_factor();
                ((area.size.width as f64 / scale - 48.0).clamp(480.0, 1400.0),
                 (area.size.height as f64 / scale - 80.0).clamp(360.0, 900.0))
            }).unwrap_or((1100.0, 720.0));
            let mut builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title(concat!("Hero Siege Item Codex — Test ", env!("CARGO_PKG_VERSION")))
                .inner_size(width, height).min_inner_size(width.min(720.0), height.min(540.0))
                .theme(Some(tauri::Theme::Light))
                .background_color(tauri::webview::Color(247, 244, 237, 255))
                .center().visible(!qa).devtools(false)
                .on_navigation(move |url| {
                    if external_allowed(url) { let _ = nav_app.opener().open_url(url.as_str(), None::<&str>); return false; }
                    (matches!(url.scheme(), "http" | "https") && url.host_str() == Some("tauri.localhost"))
                        || url.scheme() == "tauri"
                        || (cfg!(debug_assertions) && url.scheme() == "http"
                            && url.host_str() == Some("127.0.0.1") && url.port() == Some(5190))
                })
                .on_new_window(move |url, _| {
                    if external_allowed(&url) { let _ = new_window_app.opener().open_url(url.as_str(), None::<&str>); }
                    NewWindowResponse::Deny
                });
            if qa {
                // Opt-in QA uses an isolated profile; ordinary launches expose no
                // debugging port and retain their own reading-position storage.
                let profile = std::env::temp_dir().join(format!("HSItemCodex-qa-{}", std::process::id()));
                builder = builder.data_directory(profile);
            }
            builder.build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Unable to start the Item Codex");
}
