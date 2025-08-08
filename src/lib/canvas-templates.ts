import { CanvasElement, Point } from '@/types/study-board';

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  category: 'brainstorming' | 'planning' | 'analysis' | 'presentation';
  thumbnail?: string;
  elements: CanvasElement[];
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: 'mind-map',
    name: 'Mind Map',
    description: 'Central topic with branching ideas',
    category: 'brainstorming',
    elements: [
      {
        id: 'central-topic',
        type: 'shape',
        position: { x: 500, y: 300 },
        layer: 0,
        properties: {
          shapeType: 'circle',
          width: 120,
          height: 120,
          fill: '#e3f2fd',
          stroke: '#1976d2',
          strokeWidth: 3,
        },
      },
      {
        id: 'central-text',
        type: 'text',
        position: { x: 530, y: 350 },
        layer: 1,
        properties: {
          text: 'Main Topic',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#1976d2',
        },
      },
      // Branch 1
      {
        id: 'branch-1',
        type: 'shape',
        position: { x: 200, y: 150 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 100,
          height: 60,
          fill: '#fff3e0',
          stroke: '#f57c00',
          strokeWidth: 2,
        },
      },
      {
        id: 'branch-1-text',
        type: 'text',
        position: { x: 230, y: 170 },
        layer: 1,
        properties: {
          text: 'Idea 1',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#f57c00',
        },
      },
      // Branch 2
      {
        id: 'branch-2',
        type: 'shape',
        position: { x: 700, y: 150 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 100,
          height: 60,
          fill: '#e8f5e8',
          stroke: '#388e3c',
          strokeWidth: 2,
        },
      },
      {
        id: 'branch-2-text',
        type: 'text',
        position: { x: 730, y: 170 },
        layer: 1,
        properties: {
          text: 'Idea 2',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#388e3c',
        },
      },
      // Branch 3
      {
        id: 'branch-3',
        type: 'shape',
        position: { x: 200, y: 450 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 100,
          height: 60,
          fill: '#fce4ec',
          stroke: '#c2185b',
          strokeWidth: 2,
        },
      },
      {
        id: 'branch-3-text',
        type: 'text',
        position: { x: 230, y: 470 },
        layer: 1,
        properties: {
          text: 'Idea 3',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#c2185b',
        },
      },
      // Branch 4
      {
        id: 'branch-4',
        type: 'shape',
        position: { x: 700, y: 450 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 100,
          height: 60,
          fill: '#f3e5f5',
          stroke: '#7b1fa2',
          strokeWidth: 2,
        },
      },
      {
        id: 'branch-4-text',
        type: 'text',
        position: { x: 730, y: 470 },
        layer: 1,
        properties: {
          text: 'Idea 4',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#7b1fa2',
        },
      },
    ],
  },
  {
    id: 'flowchart',
    name: 'Flowchart',
    description: 'Process flow with decision points',
    category: 'planning',
    elements: [
      // Start
      {
        id: 'start',
        type: 'shape',
        position: { x: 500, y: 50 },
        layer: 0,
        properties: {
          shapeType: 'circle',
          width: 80,
          height: 80,
          fill: '#e8f5e8',
          stroke: '#388e3c',
          strokeWidth: 2,
        },
      },
      {
        id: 'start-text',
        type: 'text',
        position: { x: 525, y: 85 },
        layer: 1,
        properties: {
          text: 'Start',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#388e3c',
        },
      },
      // Process 1
      {
        id: 'process-1',
        type: 'shape',
        position: { x: 450, y: 180 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 120,
          height: 60,
          fill: '#e3f2fd',
          stroke: '#1976d2',
          strokeWidth: 2,
        },
      },
      {
        id: 'process-1-text',
        type: 'text',
        position: { x: 480, y: 200 },
        layer: 1,
        properties: {
          text: 'Process 1',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#1976d2',
        },
      },
      // Decision
      {
        id: 'decision',
        type: 'shape',
        position: { x: 450, y: 300 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 120,
          height: 80,
          fill: '#fff3e0',
          stroke: '#f57c00',
          strokeWidth: 2,
        },
      },
      {
        id: 'decision-text',
        type: 'text',
        position: { x: 480, y: 330 },
        layer: 1,
        properties: {
          text: 'Decision?',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#f57c00',
        },
      },
      // Process 2 (Yes)
      {
        id: 'process-2',
        type: 'shape',
        position: { x: 250, y: 450 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 120,
          height: 60,
          fill: '#e8f5e8',
          stroke: '#388e3c',
          strokeWidth: 2,
        },
      },
      {
        id: 'process-2-text',
        type: 'text',
        position: { x: 280, y: 470 },
        layer: 1,
        properties: {
          text: 'Process 2',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#388e3c',
        },
      },
      // Process 3 (No)
      {
        id: 'process-3',
        type: 'shape',
        position: { x: 650, y: 450 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 120,
          height: 60,
          fill: '#fce4ec',
          stroke: '#c2185b',
          strokeWidth: 2,
        },
      },
      {
        id: 'process-3-text',
        type: 'text',
        position: { x: 680, y: 470 },
        layer: 1,
        properties: {
          text: 'Process 3',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#c2185b',
        },
      },
      // End
      {
        id: 'end',
        type: 'shape',
        position: { x: 500, y: 580 },
        layer: 0,
        properties: {
          shapeType: 'circle',
          width: 80,
          height: 80,
          fill: '#fce4ec',
          stroke: '#c2185b',
          strokeWidth: 2,
        },
      },
      {
        id: 'end-text',
        type: 'text',
        position: { x: 530, y: 615 },
        layer: 1,
        properties: {
          text: 'End',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#c2185b',
        },
      },
    ],
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Chronological sequence of events',
    category: 'planning',
    elements: [
      // Timeline line
      {
        id: 'timeline-line',
        type: 'shape',
        position: { x: 100, y: 300 },
        layer: 0,
        properties: {
          shapeType: 'line',
          width: 800,
          height: 0,
          fill: 'transparent',
          stroke: '#424242',
          strokeWidth: 4,
        },
      },
      // Event 1
      {
        id: 'event-1',
        type: 'shape',
        position: { x: 190, y: 290 },
        layer: 1,
        properties: {
          shapeType: 'circle',
          width: 20,
          height: 20,
          fill: '#1976d2',
          stroke: '#ffffff',
          strokeWidth: 2,
        },
      },
      {
        id: 'event-1-text',
        type: 'text',
        position: { x: 170, y: 250 },
        layer: 1,
        properties: {
          text: 'Event 1\nJan 2024',
          fontSize: 12,
          fontFamily: 'Arial',
          color: '#1976d2',
        },
      },
      // Event 2
      {
        id: 'event-2',
        type: 'shape',
        position: { x: 340, y: 290 },
        layer: 1,
        properties: {
          shapeType: 'circle',
          width: 20,
          height: 20,
          fill: '#388e3c',
          stroke: '#ffffff',
          strokeWidth: 2,
        },
      },
      {
        id: 'event-2-text',
        type: 'text',
        position: { x: 320, y: 320 },
        layer: 1,
        properties: {
          text: 'Event 2\nMar 2024',
          fontSize: 12,
          fontFamily: 'Arial',
          color: '#388e3c',
        },
      },
      // Event 3
      {
        id: 'event-3',
        type: 'shape',
        position: { x: 490, y: 290 },
        layer: 1,
        properties: {
          shapeType: 'circle',
          width: 20,
          height: 20,
          fill: '#f57c00',
          stroke: '#ffffff',
          strokeWidth: 2,
        },
      },
      {
        id: 'event-3-text',
        type: 'text',
        position: { x: 470, y: 250 },
        layer: 1,
        properties: {
          text: 'Event 3\nMay 2024',
          fontSize: 12,
          fontFamily: 'Arial',
          color: '#f57c00',
        },
      },
      // Event 4
      {
        id: 'event-4',
        type: 'shape',
        position: { x: 640, y: 290 },
        layer: 1,
        properties: {
          shapeType: 'circle',
          width: 20,
          height: 20,
          fill: '#c2185b',
          stroke: '#ffffff',
          strokeWidth: 2,
        },
      },
      {
        id: 'event-4-text',
        type: 'text',
        position: { x: 620, y: 320 },
        layer: 1,
        properties: {
          text: 'Event 4\nJul 2024',
          fontSize: 12,
          fontFamily: 'Arial',
          color: '#c2185b',
        },
      },
      // Event 5
      {
        id: 'event-5',
        type: 'shape',
        position: { x: 790, y: 290 },
        layer: 1,
        properties: {
          shapeType: 'circle',
          width: 20,
          height: 20,
          fill: '#7b1fa2',
          stroke: '#ffffff',
          strokeWidth: 2,
        },
      },
      {
        id: 'event-5-text',
        type: 'text',
        position: { x: 770, y: 250 },
        layer: 1,
        properties: {
          text: 'Event 5\nSep 2024',
          fontSize: 12,
          fontFamily: 'Arial',
          color: '#7b1fa2',
        },
      },
    ],
  },
  {
    id: 'kanban',
    name: 'Kanban Board',
    description: 'Task management with columns',
    category: 'planning',
    elements: [
      // To Do Column
      {
        id: 'todo-column',
        type: 'shape',
        position: { x: 100, y: 100 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 200,
          height: 400,
          fill: '#f5f5f5',
          stroke: '#e0e0e0',
          strokeWidth: 2,
        },
      },
      {
        id: 'todo-header',
        type: 'text',
        position: { x: 170, y: 120 },
        layer: 1,
        properties: {
          text: 'To Do',
          fontSize: 18,
          fontFamily: 'Arial',
          color: '#424242',
        },
      },
      // In Progress Column
      {
        id: 'progress-column',
        type: 'shape',
        position: { x: 350, y: 100 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 200,
          height: 400,
          fill: '#fff3e0',
          stroke: '#ffb74d',
          strokeWidth: 2,
        },
      },
      {
        id: 'progress-header',
        type: 'text',
        position: { x: 410, y: 120 },
        layer: 1,
        properties: {
          text: 'In Progress',
          fontSize: 18,
          fontFamily: 'Arial',
          color: '#f57c00',
        },
      },
      // Done Column
      {
        id: 'done-column',
        type: 'shape',
        position: { x: 600, y: 100 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 200,
          height: 400,
          fill: '#e8f5e8',
          stroke: '#81c784',
          strokeWidth: 2,
        },
      },
      {
        id: 'done-header',
        type: 'text',
        position: { x: 670, y: 120 },
        layer: 1,
        properties: {
          text: 'Done',
          fontSize: 18,
          fontFamily: 'Arial',
          color: '#388e3c',
        },
      },
      // Sample tasks
      {
        id: 'task-1',
        type: 'sticky',
        position: { x: 120, y: 160 },
        layer: 1,
        properties: {
          text: 'Task 1',
          color: '#ffeb3b',
          width: 160,
          height: 60,
          fontSize: 14,
        },
      },
      {
        id: 'task-2',
        type: 'sticky',
        position: { x: 120, y: 240 },
        layer: 1,
        properties: {
          text: 'Task 2',
          color: '#ffeb3b',
          width: 160,
          height: 60,
          fontSize: 14,
        },
      },
      {
        id: 'task-3',
        type: 'sticky',
        position: { x: 370, y: 160 },
        layer: 1,
        properties: {
          text: 'Task 3',
          color: '#ff9800',
          width: 160,
          height: 60,
          fontSize: 14,
        },
      },
      {
        id: 'task-4',
        type: 'sticky',
        position: { x: 620, y: 160 },
        layer: 1,
        properties: {
          text: 'Task 4',
          color: '#4caf50',
          width: 160,
          height: 60,
          fontSize: 14,
        },
      },
    ],
  },
  {
    id: 'concept-map',
    name: 'Concept Map',
    description: 'Connected concepts with relationships',
    category: 'analysis',
    elements: [
      // Central concept
      {
        id: 'central-concept',
        type: 'shape',
        position: { x: 450, y: 250 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 140,
          height: 80,
          fill: '#e3f2fd',
          stroke: '#1976d2',
          strokeWidth: 3,
        },
      },
      {
        id: 'central-concept-text',
        type: 'text',
        position: { x: 490, y: 280 },
        layer: 1,
        properties: {
          text: 'Main Concept',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#1976d2',
        },
      },
      // Related concepts
      {
        id: 'concept-1',
        type: 'shape',
        position: { x: 200, y: 100 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 120,
          height: 60,
          fill: '#fff3e0',
          stroke: '#f57c00',
          strokeWidth: 2,
        },
      },
      {
        id: 'concept-1-text',
        type: 'text',
        position: { x: 230, y: 120 },
        layer: 1,
        properties: {
          text: 'Concept A',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#f57c00',
        },
      },
      {
        id: 'concept-2',
        type: 'shape',
        position: { x: 650, y: 100 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 120,
          height: 60,
          fill: '#e8f5e8',
          stroke: '#388e3c',
          strokeWidth: 2,
        },
      },
      {
        id: 'concept-2-text',
        type: 'text',
        position: { x: 680, y: 120 },
        layer: 1,
        properties: {
          text: 'Concept B',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#388e3c',
        },
      },
      {
        id: 'concept-3',
        type: 'shape',
        position: { x: 200, y: 400 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 120,
          height: 60,
          fill: '#fce4ec',
          stroke: '#c2185b',
          strokeWidth: 2,
        },
      },
      {
        id: 'concept-3-text',
        type: 'text',
        position: { x: 230, y: 420 },
        layer: 1,
        properties: {
          text: 'Concept C',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#c2185b',
        },
      },
      {
        id: 'concept-4',
        type: 'shape',
        position: { x: 650, y: 400 },
        layer: 0,
        properties: {
          shapeType: 'rectangle',
          width: 120,
          height: 60,
          fill: '#f3e5f5',
          stroke: '#7b1fa2',
          strokeWidth: 2,
        },
      },
      {
        id: 'concept-4-text',
        type: 'text',
        position: { x: 680, y: 420 },
        layer: 1,
        properties: {
          text: 'Concept D',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#7b1fa2',
        },
      },
      // Relationship labels
      {
        id: 'relation-1',
        type: 'text',
        position: { x: 350, y: 180 },
        layer: 1,
        properties: {
          text: 'relates to',
          fontSize: 12,
          fontFamily: 'Arial',
          color: '#666666',
        },
      },
      {
        id: 'relation-2',
        type: 'text',
        position: { x: 580, y: 180 },
        layer: 1,
        properties: {
          text: 'influences',
          fontSize: 12,
          fontFamily: 'Arial',
          color: '#666666',
        },
      },
      {
        id: 'relation-3',
        type: 'text',
        position: { x: 350, y: 350 },
        layer: 1,
        properties: {
          text: 'depends on',
          fontSize: 12,
          fontFamily: 'Arial',
          color: '#666666',
        },
      },
      {
        id: 'relation-4',
        type: 'text',
        position: { x: 580, y: 350 },
        layer: 1,
        properties: {
          text: 'supports',
          fontSize: 12,
          fontFamily: 'Arial',
          color: '#666666',
        },
      },
    ],
  },
];

export function getTemplateById(id: string): CanvasTemplate | undefined {
  return CANVAS_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: CanvasTemplate['category']): CanvasTemplate[] {
  return CANVAS_TEMPLATES.filter(template => template.category === category);
}

export function createElementsFromTemplate(template: CanvasTemplate, offset: Point = { x: 0, y: 0 }): CanvasElement[] {
  return template.elements.map(element => ({
    ...element,
    id: `${element.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    position: {
      x: element.position.x + offset.x,
      y: element.position.y + offset.y,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}