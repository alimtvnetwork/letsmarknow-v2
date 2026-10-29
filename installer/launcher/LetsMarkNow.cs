using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
using Microsoft.Win32;

namespace LetsMarkNowLauncher
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                string extensionDir = Path.Combine(baseDir, "extension");

                // In case running from bin/ or repo during development
                if (!Directory.Exists(extensionDir))
                {
                    string candidate = Path.Combine(baseDir, @"..\dist\extension");
                    if (Directory.Exists(candidate))
                    {
                        extensionDir = Path.GetFullPath(candidate);
                    }
                }

                if (!Directory.Exists(extensionDir))
                {
                    MessageBox.Show(
                        "Could not locate the LetsMarkNow extension directory:\n" + extensionDir,
                        "LetsMarkNow Launcher",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                string profileDir = Path.Combine(baseDir, "Profile");
                if (!Directory.Exists(profileDir))
                {
                    Directory.CreateDirectory(profileDir);
                }

                string browserExe = FindChromiumBrowser();
                if (string.IsNullOrEmpty(browserExe))
                {
                    MessageBox.Show(
                        "Google Chrome or Microsoft Edge was not found on your system.\nPlease install Google Chrome to run LetsMarkNow.",
                        "Browser Not Found",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning
                    );
                    return;
                }

                // Command-line flags to load extension, isolate user profile, and start in fullscreen.
                // NOTE: We do not pass chrome-extension:// as a command-line argument because Chromium
                // blocks command-line navigation to extension URLs before the extension is registered (ERR_BLOCKED_BY_CLIENT).
                // The extension's newtab override and service worker natively launch app.html immediately.
                string launchArgs = string.Format(
                    "--disable-extensions-except=\"{0}\" --load-extension=\"{0}\" --user-data-dir=\"{1}\" --start-fullscreen --no-first-run --no-default-browser-check",
                    extensionDir,
                    profileDir
                );

                ProcessStartInfo startInfo = new ProcessStartInfo
                {
                    FileName = browserExe,
                    Arguments = launchArgs,
                    UseShellExecute = true,
                    WindowStyle = ProcessWindowStyle.Normal
                };

                Process.Start(startInfo);
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Failed to launch LetsMarkNow: " + ex.Message,
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }

        private static string FindChromiumBrowser()
        {
            // 1. Check Google Chrome via Registry
            string chromePath = GetAppPathFromRegistry("chrome.exe");
            if (!string.IsNullOrEmpty(chromePath) && File.Exists(chromePath))
            {
                return chromePath;
            }

            // 2. Check Google Chrome via standard file paths
            string[] chromePaths = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };

            foreach (string path in chromePaths)
            {
                if (File.Exists(path))
                {
                    return path;
                }
            }

            // 3. Fallback: Check Microsoft Edge via Registry
            string edgePath = GetAppPathFromRegistry("msedge.exe");
            if (!string.IsNullOrEmpty(edgePath) && File.Exists(edgePath))
            {
                return edgePath;
            }

            // 4. Fallback: Check Microsoft Edge via standard file paths
            string[] edgePaths = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe")
            };

            foreach (string path in edgePaths)
            {
                if (File.Exists(path))
                {
                    return path;
                }
            }

            return null;
        }

        private static string GetAppPathFromRegistry(string exeName)
        {
            string subKey = @"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\" + exeName;

            using (RegistryKey key = Registry.LocalMachine.OpenSubKey(subKey))
            {
                if (key != null)
                {
                    object val = key.GetValue("");
                    if (val != null)
                    {
                        return val.ToString();
                    }
                }
            }

            using (RegistryKey key = Registry.CurrentUser.OpenSubKey(subKey))
            {
                if (key != null)
                {
                    object val = key.GetValue("");
                    if (val != null)
                    {
                        return val.ToString();
                    }
                }
            }

            return null;
        }
    }
}
