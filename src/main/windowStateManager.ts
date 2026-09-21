import { app, BrowserWindow, screen } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface WindowBoundsState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

const DEFAULT_STATE: WindowBoundsState = {
  width: 1280,
  height: 850,
  isMaximized: false,
};

export class WindowStateManager {
  private state: WindowBoundsState = { ...DEFAULT_STATE };
  private filePath: string;
  private saveTimeout: NodeJS.Timeout | null = null;
  private normalBounds: { x?: number; y?: number; width: number; height: number } = {
    width: DEFAULT_STATE.width,
    height: DEFAULT_STATE.height,
  };

  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'bocchy-window-state.json');
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.width === 'number' && typeof parsed.height === 'number') {
          this.state = {
            x: typeof parsed.x === 'number' ? parsed.x : undefined,
            y: typeof parsed.y === 'number' ? parsed.y : undefined,
            width: Math.max(parsed.width, 800),
            height: Math.max(parsed.height, 600),
            isMaximized: Boolean(parsed.isMaximized),
          };
          this.normalBounds = {
            x: this.state.x,
            y: this.state.y,
            width: this.state.width,
            height: this.state.height,
          };
        }
      }
    } catch (e) {
      console.error('[WindowState] Failed to load window state:', e);
    }
  }

  /**
   * Validates coordinates against all currently connected monitors.
   * If monitor was disconnected or coordinates are off-screen, positions safely on primary display.
   */
  public getValidState(): WindowBoundsState {
    const displays = screen.getAllDisplays();
    const { x, y, width, height, isMaximized } = this.state;

    if (typeof x === 'number' && typeof y === 'number') {
      const isVisible = displays.some((display) => {
        const { x: dx, y: dy, width: dw, height: dh } = display.bounds;
        // Require at least 100px overlap with a display
        return (
          x + 100 > dx &&
          x < dx + dw - 100 &&
          y + 100 > dy &&
          y < dy + dh - 100
        );
      });

      if (isVisible) {
        return { x, y, width, height, isMaximized };
      }
    }

    // Default to centered dimensions on primary display if off-screen
    return {
      width: Math.max(width, 800),
      height: Math.max(height, 600),
      isMaximized,
    };
  }

  public manage(window: BrowserWindow) {
    const updateState = () => {
      if (!window || window.isDestroyed()) return;

      const isMaximized = window.isMaximized();
      if (!isMaximized && !window.isMinimized()) {
        const bounds = window.getBounds();
        this.normalBounds = {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        };
        this.state = {
          ...this.normalBounds,
          isMaximized: false,
        };
      } else if (isMaximized) {
        // Try getting normal unmaximized bounds if supported
        try {
          if (typeof window.getNormalBounds === 'function') {
            const nb = window.getNormalBounds();
            if (nb && nb.width >= 800 && nb.height >= 600) {
              this.normalBounds = {
                x: nb.x,
                y: nb.y,
                width: nb.width,
                height: nb.height,
              };
            }
          }
        } catch (e) {}

        this.state = {
          ...this.normalBounds,
          isMaximized: true,
        };
      }

      this.scheduleSave();
    };

    window.on('resize', updateState);
    window.on('move', updateState);
    window.on('maximize', updateState);
    window.on('unmaximize', updateState);
    window.on('close', () => {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
      // Capture final state before closing
      if (!window.isDestroyed()) {
        const isMaximized = window.isMaximized();
        if (isMaximized) {
          this.state.isMaximized = true;
        } else {
          const bounds = window.getBounds();
          this.state = {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            isMaximized: false,
          };
        }
      }
      this.saveSync();
    });
  }

  public resetToDefault(window?: BrowserWindow) {
    this.state = { ...DEFAULT_STATE };
    this.normalBounds = {
      width: DEFAULT_STATE.width,
      height: DEFAULT_STATE.height,
    };
    this.saveSync();

    if (window && !window.isDestroyed()) {
      if (window.isMaximized()) {
        window.unmaximize();
      }
      window.setSize(DEFAULT_STATE.width, DEFAULT_STATE.height);
      window.center();
    }
  }

  private scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveSync();
    }, 500);
  }

  private saveSync() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), 'utf-8');
      console.log(`[WindowState] Saved: ${this.state.width}x${this.state.height}, max=${this.state.isMaximized}`);
    } catch (e) {
      console.error('[WindowState] Failed to save window state:', e);
    }
  }

  public getState(): WindowBoundsState {
    return this.state;
  }
}
