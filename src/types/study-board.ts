export interface Point {
  x: number;
  y: number;
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'drawing' | 'sticky' | 'shape';
  position: Point;
  properties: Record<string, any>;
  layer: number;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TextElement extends CanvasElement {
  type: 'text';
  properties: {
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    width?: number;
    height?: number;
  };
}

export interface DrawingElement extends CanvasElement {
  type: 'drawing';
  properties: {
    path: string;
    strokeWidth: number;
    strokeColor: string;
    fill?: string;
  };
}

export interface StickyElement extends CanvasElement {
  type: 'sticky';
  properties: {
    text: string;
    color: string;
    width: number;
    height: number;
    fontSize: number;
  };
}

export interface ShapeElement extends CanvasElement {
  type: 'shape';
  properties: {
    shapeType: 'rectangle' | 'circle' | 'triangle' | 'line';
    width: number;
    height: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
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

export type DrawingTool = 'select' | 'pen' | 'text' | 'sticky' | 'rectangle' | 'circle' | 'triangle' | 'line';

export interface CanvasSettings {
  width: number;
  height: number;
  backgroundColor: string;
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number;
}