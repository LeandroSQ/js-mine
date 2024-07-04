import { Size } from "./types/size";

// Mainly for debugging purposes
export const RECORDING_FRAME_RATE = 24;
export const RECORDING_VIEWPORT = { width: 808, height: 808 } as Size;
export const SIMULATION_FREQUENCY = 60;
export const SIMULATION_SUBSTEPS = 1;
export const USE_ANIMATION_FRAME = true;

// Chunk system
export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 64;

// Gamepad
export const GAMEPAD_DEADZONE = 0.1;
export const GAMEPAD_LOOK_SENSITIVITY = 5.0;
export const GAMEPAD_LINEARITY = 2.0;

// Layout
export const GUI_MARGIN = 15;

// Font
export const FONT_SIZE = 12;
export const FONT_FAMILY = "'Pixelify sans', 'Ubuntu Mono', sans-serif";

// Input
export const LONG_PRESS = 110;