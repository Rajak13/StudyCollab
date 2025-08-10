export interface Point {
  x: number;
  y: number;
}

export interface CanvasElement {
  id: string;
  type: 'pen' | 'eraser' | 'text' | 'sticky' | 'rectangle' | 'circle' | 'triangle' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
  points?: number[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TextElement extends CanvasElement {
  type: 'text';
  text: string;
  fontSize: number;
  width: number;
  height: number;
}

export interface DrawingElement extends CanvasElement {
  type: 'pen' | 'eraser';
  points: number[];
}

export interface StickyElement extends CanvasElement {
  type: 'sticky';
  text: string;
  width: number;
  height: number;
  fontSize: number;
}

export interface ShapeElement extends CanvasElement {
  type: 'rectangle' | 'circle' | 'triangle' | 'line';
  width: number;
  height: number;
}

export interface CanvasState {
  elements: CanvasElement[];
  version: number;
  lastModified: Date;
}

export interface CanvasChange {
  id: string;
  type: 'add' | 'update' | 'delete';
  element: CanvasElement;
  userId?: string;
  timestamp: number;
}

export type DrawingTool = 'select' | 'pen' | 'eraser' | 'text' | 'sticky' | 'rectangle' | 'circle' | 'triangle' | 'line';

export interface CanvasSettings {
  width: number;
  height: number;
  backgroundColor: string;
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number;
}