import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, Palette } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ColorSettings {
  darkBackground: string;
  darkSurface: string;
  darkText: string;
}

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [colorSettings, setColorSettings] = useState<ColorSettings>(() => {
    const savedSettings = localStorage.getItem("theme-color-settings");
    return savedSettings
      ? JSON.parse(savedSettings)
      : {
          darkBackground: "#121212",
          darkSurface: "#1E1E1E",
          darkText: "#E0E0E0",
        };
  });

  // Convert hex to hsl for the CSS variables
  const hexToHSL = (hex: string) => {
    // Remove the # if present
    hex = hex.replace(/^#/, "");

    // Parse the hex values
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;

    // Find the min and max values to calculate the lightness
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      // Achromatic
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
        default:
          h = 0;
      }
      h /= 6;
    }

    // Convert to degrees, percentage, and percentage
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
  };

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem("theme-color-settings", JSON.stringify(colorSettings));

    // Apply the custom colors to the document
    if (theme === "dark") {
      document.documentElement.style.setProperty(
        "--background",
        hexToHSL(colorSettings.darkBackground),
      );
      document.documentElement.style.setProperty(
        "--card",
        hexToHSL(colorSettings.darkSurface),
      );
      document.documentElement.style.setProperty(
        "--popover",
        hexToHSL(colorSettings.darkSurface),
      );
      document.documentElement.style.setProperty(
        "--foreground",
        hexToHSL(colorSettings.darkText),
      );
      document.documentElement.style.setProperty(
        "--card-foreground",
        hexToHSL(colorSettings.darkText),
      );
      document.documentElement.style.setProperty(
        "--popover-foreground",
        hexToHSL(colorSettings.darkText),
      );
    }
  }, [colorSettings, theme]);

  const handleColorChange = (key: keyof ColorSettings, value: string) => {
    setColorSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetToDefaults = () => {
    const defaults = {
      darkBackground: "#121212",
      darkSurface: "#1E1E1E",
      darkText: "#E0E0E0",
    };
    setColorSettings(defaults);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Theme settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Theme Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label className="dark:text-white">Theme</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="flex items-center gap-1"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="flex items-center gap-1"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
            </div>
          </div>

          {theme === "dark" && (
            <>
              <div className="space-y-2">
                <Label className="dark:text-white">Background Color</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={colorSettings.darkBackground}
                    onChange={(e) =>
                      handleColorChange("darkBackground", e.target.value)
                    }
                    className="h-8 w-8 rounded-md border border-gray-300 dark:border-gray-600"
                  />
                  <div className="flex-1">
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[
                        parseInt(
                          hexToHSL(colorSettings.darkBackground).split(" ")[2],
                        ),
                      ]}
                      onValueChange={(value) => {
                        // Adjust only the lightness of the background color
                        const hsl = hexToHSL(
                          colorSettings.darkBackground,
                        ).split(" ");
                        const h = hsl[0];
                        const s = hsl[1];
                        // Convert HSL to hex (simplified for this example)
                        // In a real app, you'd need a proper HSL to hex conversion
                        const newColor = `#${Math.round((value[0] / 100) * 255)
                          .toString(16)
                          .padStart(2, "0")}${Math.round((value[0] / 100) * 255)
                          .toString(16)
                          .padStart(2, "0")}${Math.round((value[0] / 100) * 255)
                          .toString(16)
                          .padStart(2, "0")}`;
                        handleColorChange("darkBackground", newColor);
                      }}
                      className="dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-white">Surface Color</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={colorSettings.darkSurface}
                    onChange={(e) =>
                      handleColorChange("darkSurface", e.target.value)
                    }
                    className="h-8 w-8 rounded-md border border-gray-300 dark:border-gray-600"
                  />
                  <div className="flex-1">
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[
                        parseInt(
                          hexToHSL(colorSettings.darkSurface).split(" ")[2],
                        ),
                      ]}
                      onValueChange={(value) => {
                        // Simplified for example
                        const newColor = `#${Math.round((value[0] / 100) * 255)
                          .toString(16)
                          .padStart(2, "0")}${Math.round((value[0] / 100) * 255)
                          .toString(16)
                          .padStart(2, "0")}${Math.round((value[0] / 100) * 255)
                          .toString(16)
                          .padStart(2, "0")}`;
                        handleColorChange("darkSurface", newColor);
                      }}
                      className="dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-white">Text Color</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={colorSettings.darkText}
                    onChange={(e) =>
                      handleColorChange("darkText", e.target.value)
                    }
                    className="h-8 w-8 rounded-md border border-gray-300 dark:border-gray-600"
                  />
                  <div className="flex-1">
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[
                        parseInt(
                          hexToHSL(colorSettings.darkText).split(" ")[2],
                        ),
                      ]}
                      onValueChange={(value) => {
                        // Simplified for example
                        const newColor = `#${Math.round((value[0] / 100) * 255)
                          .toString(16)
                          .padStart(2, "0")}${Math.round((value[0] / 100) * 255)
                          .toString(16)
                          .padStart(2, "0")}${Math.round((value[0] / 100) * 255)
                          .toString(16)
                          .padStart(2, "0")}`;
                        handleColorChange("darkText", newColor);
                      }}
                      className="dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={resetToDefaults}
                className="mt-2 dark:text-white dark:border-gray-600"
              >
                Reset to Defaults
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
