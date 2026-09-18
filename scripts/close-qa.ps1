param([Parameter(Mandatory = $true)][int]$CodexProcessId)
$ErrorActionPreference = 'Stop'
$codexProcess = Get-Process -Id $CodexProcessId
if ($codexProcess.ProcessName -ne 'hero-siege-item-codex') { throw 'This is not the Codex process.' }
Add-Type @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class CodexWindowQA {
    public delegate bool EnumProc(IntPtr window, IntPtr data);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc callback, IntPtr data);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr window, out uint processId);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr window, StringBuilder text, int count);
    [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);
    public static int Close(uint processId) {
        int count = 0;
        EnumWindows((window, data) => {
            uint owner;
            GetWindowThreadProcessId(window, out owner);
            if (owner != processId) return true;
            var title = new StringBuilder(256);
            GetWindowText(window, title, title.Capacity);
            if (title.ToString().StartsWith("Hero Siege Item Codex")) {
                PostMessage(window, 0x0010, IntPtr.Zero, IntPtr.Zero);
                count++;
            }
            return true;
        }, IntPtr.Zero);
        return count;
    }
}
'@
$closed = [CodexWindowQA]::Close($CodexProcessId)
if ($closed -ne 1) { throw "Expected one Codex application window, found $closed." }
if (-not $codexProcess.WaitForExit(10000)) { throw 'Codex did not exit after closing its main window.' }
"Closed Codex normally: $CodexProcessId"
