'use client';

import { useStudyBoardStore } from '@/lib/stores/study-board-store';
import Konva from 'konva';
import { useEffect, useRef, useState } from 'react';
import { Layer, Line, Stage } from 'react-konva';

interface StudyBoardCanvasProps {
  groupId?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function StudyBoardCanvas({ 
  groupId, 
  width = 1200, 
  height = 800, 
  className = '' 
}: StudyBoardCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const {
    stage,
    layer,
    setStage,
    setLayer,
    selectedTool,
    settings,
    addTextElement,
    addStickyNote,
    addShape,
    updateSettings,
  } = useStudyBoardStore();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<number[]>([]);

  useEffect(() => {
    if (stageRef.current && layerRef.current) {
      setStage(stageRef.current);
      setLayer(layerRef.current);
      updateSettings({ width, height });
    }
  }, [setStage, setLayer, updateSettings, width, height]);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!layerRef.current) return;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const position = { x: pos.x, y: pos.y };

    switch (selectedTool) {
      case 'text':
        const text = prompt('Enter text:');
        if (text) {
          addTextElement(text, position);
        }
        break;
      case 'sticky':
        const stickyText = prompt('Enter sticky note text:');
        if (stickyText) {
          addStickyNote(stickyText, position);
        }
        break;
      case 'rectangle':
        addShape('rectangle', position);
        break;
      case 'circle':
        addShape('circle', position);
        break;
      case 'triangle':
        addShape('triangle', position);
        break;
      case 'line':
        addShape('line', position);
        break;
      case 'pen':
        setIsDrawing(true);
        setCurrentPath([pos.x, pos.y]);
        break;
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || selectedTool !== 'pen') return;

    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    setCurrentPath(prev => [...prev, point.x, point.y]);
  };

  const handleMouseUp = () => {
    if (isDrawing && selectedTool === 'pen' && currentPath.length > 0) {
      // Create a permanent line from the current path
      const drawingElement = {
        id: `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'drawing' as const,
        position: { x: currentPath[0], y: currentPath[1] },
        layer: 0,
        properties: {
          path: currentPath.join(','),
          strokeWidth: 2,
          strokeColor: '#000000',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useStudyBoardStore.getState().addElement(drawingElement);
    }

    setIsDrawing(false);
    setCurrentPath([]);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const elementId = e.target.getAttr('elementId');
    if (elementId) {
      const updates = {
        position: { x: e.target.x(), y: e.target.y() },
        updatedAt: new Date(),
      };
      useStudyBoardStore.getState().updateElement(elementId, updates);
    }
  };

  return (
    <div className={`study-board-canvas ${className}`}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        className="border border-gray-300 rounded-lg shadow-sm"
      >
        <Layer ref={layerRef}>
          {/* Current drawing path */}
          {isDrawing && currentPath.length > 0 && (
            <Line
              points={currentPath}
              stroke="#000000"
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation="source-over"
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}