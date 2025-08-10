import {
  CanvasElement,
  CanvasSettings,
  CanvasState,
  DrawingTool,
  Point
} from '@/types/study-board';
import Konva from 'konva';
import { create } from 'zustand';

interface StudyBoardStore {
  // Canvas instance
  stage: Konva.Stage | null;
  layer: Konva.Layer | null;

  // Canvas state
  elements: CanvasElement[];
  selectedTool: DrawingTool;
  settings: CanvasSettings;
  isDrawing: boolean;

  // Actions
  setStage: (stage: Konva.Stage) => void;
  setLayer: (layer: Konva.Layer) => void;
  setSelectedTool: (tool: DrawingTool) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  updateElementPosition: (id: string, position: Point) => void;
  removeElement: (id: string) => void;
  clearCanvas: () => void;

  // Canvas operations
  addTextElement: (text: string, position: Point) => void;
  addStickyNote: (text: string, position: Point) => void;
  addShape: (shapeType: 'rectangle' | 'circle' | 'triangle' | 'line', position: Point) => void;

  // State management
  getCanvasState: () => CanvasState;
  loadCanvasState: (state: CanvasState) => void;
  serializeCanvas: () => string;
  deserializeCanvas: (data: string) => void;

  // Settings
  updateSettings: (settings: Partial<CanvasSettings>) => void;
}

const defaultSettings: CanvasSettings = {
  width: 1200,
  height: 800,
  backgroundColor: '#ffffff',
  gridEnabled: false,
  snapToGrid: false,
  gridSize: 20,
};

export const useStudyBoardStore = create<StudyBoardStore>((set, get) => ({
  stage: null,
  layer: null,
  elements: [],
  selectedTool: 'select',
  settings: defaultSettings,
  isDrawing: false,

  setStage: (stage) => set((state) => {
    if (state.stage === stage) return state;
    return { stage };
  }),
  setLayer: (layer) => set((state) => {
    if (state.layer === layer) return state;
    return { layer };
  }),

  setSelectedTool: (tool) => set({ selectedTool: tool }),

  addElement: (element) => set((state) => {
    console.log('Store: Adding element', element)
    // Check if element already exists to prevent duplicates
    const existingIndex = state.elements.findIndex(el => el.id === element.id)
    if (existingIndex >= 0) {
      // Element exists, update it instead
      console.log('Store: Element exists, updating')
      const updatedElements = [...state.elements]
      updatedElements[existingIndex] = { ...element, updatedAt: new Date().toISOString() }
      return { elements: updatedElements }
    }
    // Element doesn't exist, add it
    console.log('Store: Adding new element, total will be:', state.elements.length + 1)
    return {
      elements: [...state.elements, element]
    }
  }),

  updateElement: (id, updates) => set((state) => ({
    elements: state.elements.map(el =>
      el.id === id ? { ...el, ...updates, updatedAt: new Date().toISOString() } : el
    )
  })),

  updateElementPosition: (id: string, position: Point) => set((state) => ({
    elements: state.elements.map(el =>
      el.id === id ? { ...el, x: position.x, y: position.y, updatedAt: new Date().toISOString() } : el
    )
  })),

  removeElement: (id) => set((state) => ({
    elements: state.elements.filter(el => el.id !== id)
  })),

  clearCanvas: () => {
    const { layer } = get();
    if (layer) {
      layer.destroyChildren();
      layer.draw();
    }
    set({ elements: [] });
  },

  addTextElement: (text, position) => {
    const { layer } = get();
    if (!layer) return;

    const textElement: CanvasElement = {
      id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type: 'text',
      x: position.x,
      y: position.y,
      width: 100,
      height: 30,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 0,
      text,
      fontSize: 16,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system'
    };

    const konvaText = new Konva.Text({
      x: position.x,
      y: position.y,
      text: text,
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#000000',
      draggable: true,
    });

    konvaText.setAttr('elementId', textElement.id);
    layer.add(konvaText);
    layer.draw();

    get().addElement(textElement);
  },

  addStickyNote: (text, position) => {
    const { layer } = get();
    if (!layer) return;

    const stickyElement: CanvasElement = {
      id: `sticky_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type: 'sticky',
      x: position.x,
      y: position.y,
      width: 150,
      height: 150,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fill: '#ffeb3b',
      stroke: '#000000',
      strokeWidth: 1,
      text,
      fontSize: 14,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system'
    };

    // Create sticky note as a group with background and text
    const group = new Konva.Group({
      x: position.x,
      y: position.y,
      draggable: true,
    });

    const background = new Konva.Rect({
      width: 150,
      height: 150,
      fill: '#ffeb3b',
      stroke: '#fbc02d',
      strokeWidth: 1,
    });

    const noteText = new Konva.Text({
      x: 10,
      y: 10,
      text: text,
      fontSize: 14,
      fill: '#000000',
      width: 130,
      height: 130,
      align: 'left',
      verticalAlign: 'top',
    });

    group.add(background);
    group.add(noteText);
    group.setAttr('elementId', stickyElement.id);

    layer.add(group);
    layer.draw();

    get().addElement(stickyElement);
  },

  addShape: (shapeType, position) => {
    const { layer } = get();
    if (!layer) return;

    const shapeElement: CanvasElement = {
      id: `shape_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type: shapeType,
      x: position.x,
      y: position.y,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system'
    };

    let konvaShape: Konva.Shape;

    switch (shapeType) {
      case 'rectangle':
        konvaShape = new Konva.Rect({
          x: position.x,
          y: position.y,
          width: 100,
          height: 100,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2,
          draggable: true,
        });
        break;
      case 'circle':
        konvaShape = new Konva.Circle({
          x: position.x + 50,
          y: position.y + 50,
          radius: 50,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2,
          draggable: true,
        });
        break;
      case 'triangle':
        konvaShape = new Konva.RegularPolygon({
          x: position.x + 50,
          y: position.y + 50,
          sides: 3,
          radius: 50,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2,
          draggable: true,
        });
        break;
      case 'line':
        konvaShape = new Konva.Line({
          points: [position.x, position.y, position.x + 100, position.y],
          stroke: '#000000',
          strokeWidth: 2,
          draggable: true,
        });
        break;
      default:
        return;
    }

    konvaShape.setAttr('elementId', shapeElement.id);
    layer.add(konvaShape);
    layer.draw();

    get().addElement(shapeElement);
  },

  getCanvasState: () => {
    const { elements } = get();
    return {
      elements,
      version: 1,
      lastModified: new Date(),
    };
  },

  loadCanvasState: (state) => {
    const { layer } = get();
    if (!layer) return;

    layer.destroyChildren();
    set({ elements: state.elements });

    // Recreate Konva objects from elements
    state.elements.forEach((element) => {
      // This would need to be implemented based on element type
      // For now, we'll just set the elements
    });

    layer.draw();
  },

  serializeCanvas: () => {
    const { stage, elements } = get();
    if (!stage) return JSON.stringify({ elements, stageData: null });

    return JSON.stringify({
      elements,
      stageData: stage.toJSON(),
    });
  },

  deserializeCanvas: (data) => {
    const { stage } = get();
    if (!stage) return;

    try {
      const parsed = JSON.parse(data);

      if (parsed.elements) {
        set({ elements: parsed.elements });
      }

      if (parsed.stageData) {
        // Note: Konva doesn't have a direct loadFromJSON like Fabric
        // We would need to recreate objects manually
        console.log('Stage data loaded:', parsed.stageData);
      }
    } catch (error) {
      console.error('Failed to deserialize canvas data:', error);
    }
  },

  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
}));