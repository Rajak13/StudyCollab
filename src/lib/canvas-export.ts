import { CanvasElement } from '@/types/study-board';
import jsPDF from 'jspdf';
import Konva from 'konva';

export interface ExportOptions {
  format: 'png' | 'jpg' | 'pdf' | 'svg';
  quality?: number;
  multiplier?: number;
  filename?: string;
  includeBackground?: boolean;
  selectedOnly?: boolean;
  elements?: CanvasElement[];
}

export interface ExportProgress {
  stage: 'preparing' | 'processing' | 'generating' | 'complete';
  progress: number;
  message: string;
}

export class CanvasExporter {
  static async exportCanvas(
    stage: Konva.Stage, 
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    const { 
      format, 
      quality = 1, 
      multiplier = 2, 
      filename,
      includeBackground = true,
      selectedOnly = false,
      elements = []
    } = options;
    
    const timestamp = Date.now();
    const defaultFilename = `study-board-${timestamp}`;

    try {
      onProgress?.({ stage: 'preparing', progress: 10, message: 'Preparing export...' });

      switch (format) {
        case 'png':
        case 'jpg':
          await this.exportAsImage(
            stage, 
            format, 
            quality, 
            multiplier, 
            filename || `${defaultFilename}.${format}`,
            includeBackground,
            selectedOnly,
            onProgress
          );
          break;
        case 'pdf':
          await this.exportAsPDF(
            stage, 
            multiplier, 
            filename || `${defaultFilename}.pdf`,
            includeBackground,
            selectedOnly,
            onProgress
          );
          break;
        case 'svg':
          await this.exportAsSVG(
            stage, 
            filename || `${defaultFilename}.svg`,
            elements,
            selectedOnly,
            onProgress
          );
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      onProgress?.({ stage: 'complete', progress: 100, message: 'Export complete!' });
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  private static async exportAsImage(
    stage: Konva.Stage,
    format: 'png' | 'jpg',
    quality: number,
    multiplier: number,
    filename: string,
    includeBackground: boolean,
    selectedOnly: boolean,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    onProgress?.({ stage: 'processing', progress: 30, message: 'Generating image...' });

    const exportOptions: any = {
      pixelRatio: multiplier,
      mimeType: format === 'jpg' ? 'image/jpeg' : 'image/png',
      quality: format === 'jpg' ? quality : 1,
    };

    if (!includeBackground) {
      exportOptions.backgroundColor = 'transparent';
    }

    if (selectedOnly) {
      // Get selected elements bounds
      const selectedNodes = stage.find('.selected');
      if (selectedNodes.length > 0) {
        const bounds = this.getNodesBounds(selectedNodes);
        exportOptions.x = bounds.x;
        exportOptions.y = bounds.y;
        exportOptions.width = bounds.width;
        exportOptions.height = bounds.height;
      }
    }

    onProgress?.({ stage: 'generating', progress: 70, message: 'Creating download...' });

    const dataURL = stage.toDataURL(exportOptions);
    this.downloadDataURL(dataURL, filename);
  }

  private static async exportAsPDF(
    stage: Konva.Stage,
    multiplier: number,
    filename: string,
    includeBackground: boolean,
    selectedOnly: boolean,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    onProgress?.({ stage: 'processing', progress: 30, message: 'Generating PDF...' });

    const exportOptions: any = {
      pixelRatio: multiplier,
    };

    if (!includeBackground) {
      exportOptions.backgroundColor = 'transparent';
    }

    let canvasWidth = stage.width();
    let canvasHeight = stage.height();

    if (selectedOnly) {
      const selectedNodes = stage.find('.selected');
      if (selectedNodes.length > 0) {
        const bounds = this.getNodesBounds(selectedNodes);
        exportOptions.x = bounds.x;
        exportOptions.y = bounds.y;
        exportOptions.width = bounds.width;
        exportOptions.height = bounds.height;
        canvasWidth = bounds.width;
        canvasHeight = bounds.height;
      }
    }

    const dataURL = stage.toDataURL(exportOptions);

    onProgress?.({ stage: 'generating', progress: 70, message: 'Creating PDF...' });

    // Calculate PDF dimensions (convert pixels to mm, assuming 96 DPI)
    const pdfWidth = (canvasWidth * 25.4) / 96;
    const pdfHeight = (canvasHeight * 25.4) / 96;

    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });

    pdf.addImage(dataURL, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  }

  private static async exportAsSVG(
    stage: Konva.Stage,
    filename: string,
    elements: CanvasElement[],
    selectedOnly: boolean,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    onProgress?.({ stage: 'processing', progress: 30, message: 'Converting to SVG...' });

    const stageWidth = stage.width();
    const stageHeight = stage.height();

    // Create SVG content
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${stageWidth}" height="${stageHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .canvas-text { font-family: Arial, sans-serif; }
      .sticky-note { filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1)); }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="white"/>
`;

    onProgress?.({ stage: 'generating', progress: 50, message: 'Converting elements...' });

    // Convert canvas elements to SVG
    const elementsToExport = selectedOnly 
      ? elements.filter(el => stage.findOne(`#${el.id}`)?.hasName('selected'))
      : elements;

    elementsToExport.forEach((element, index) => {
      const progress = 50 + (index / elementsToExport.length) * 30;
      onProgress?.({ 
        stage: 'generating', 
        progress, 
        message: `Converting element ${index + 1}/${elementsToExport.length}...` 
      });

      svgContent += this.convertElementToSVG(element);
    });

    svgContent += '</svg>';

    onProgress?.({ stage: 'generating', progress: 90, message: 'Creating download...' });

    // Create and download SVG file
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    this.downloadURL(url, filename);
    URL.revokeObjectURL(url);
  }

  private static convertElementToSVG(element: CanvasElement): string {
    const { position, properties } = element;

    switch (element.type) {
      case 'text':
        return `<text x="${position.x}" y="${position.y + (properties.fontSize || 16)}" 
                      font-size="${properties.fontSize || 16}" 
                      font-family="${properties.fontFamily || 'Arial'}" 
                      fill="${properties.color || '#000000'}" 
                      class="canvas-text">${this.escapeXml(properties.text || '')}</text>\n`;

      case 'sticky':
        const stickyWidth = properties.width || 150;
        const stickyHeight = properties.height || 150;
        return `<g class="sticky-note">
                  <rect x="${position.x}" y="${position.y}" 
                        width="${stickyWidth}" height="${stickyHeight}" 
                        fill="${properties.color || '#ffeb3b'}" 
                        stroke="#fbc02d" stroke-width="1"/>
                  <text x="${position.x + 10}" y="${position.y + 25}" 
                        font-size="${properties.fontSize || 14}" 
                        font-family="Arial" fill="#000000" 
                        class="canvas-text">
                    ${this.wrapText(properties.text || '', stickyWidth - 20, properties.fontSize || 14)}
                  </text>
                </g>\n`;

      case 'shape':
        return this.convertShapeToSVG(element);

      case 'drawing':
        const pathData = this.convertPathToSVG(properties.path || '');
        return `<path d="${pathData}" 
                      stroke="${properties.strokeColor || '#000000'}" 
                      stroke-width="${properties.strokeWidth || 2}" 
                      fill="none" 
                      stroke-linecap="round" 
                      stroke-linejoin="round"/>\n`;

      default:
        return '';
    }
  }

  private static convertShapeToSVG(element: CanvasElement): string {
    const { position, properties } = element;
    const width = properties.width || 100;
    const height = properties.height || 100;
    const fill = properties.fill || 'transparent';
    const stroke = properties.stroke || '#000000';
    const strokeWidth = properties.strokeWidth || 2;

    switch (properties.shapeType) {
      case 'rectangle':
        return `<rect x="${position.x}" y="${position.y}" 
                      width="${width}" height="${height}" 
                      fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>\n`;

      case 'circle':
        const radius = width / 2;
        const cx = position.x + radius;
        const cy = position.y + radius;
        return `<circle cx="${cx}" cy="${cy}" r="${radius}" 
                        fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>\n`;

      case 'triangle':
        const centerX = position.x + width / 2;
        const centerY = position.y + height / 2;
        const points = `${centerX},${position.y} ${position.x + width},${position.y + height} ${position.x},${position.y + height}`;
        return `<polygon points="${points}" 
                         fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>\n`;

      case 'line':
        return `<line x1="${position.x}" y1="${position.y}" 
                      x2="${position.x + width}" y2="${position.y}" 
                      stroke="${stroke}" stroke-width="${strokeWidth}"/>\n`;

      default:
        return '';
    }
  }

  private static convertPathToSVG(pathString: string): string {
    if (!pathString) return '';
    
    const points = pathString.split(',').map(Number);
    if (points.length < 4) return '';

    let path = `M ${points[0]} ${points[1]}`;
    for (let i = 2; i < points.length; i += 2) {
      if (i + 1 < points.length) {
        path += ` L ${points[i]} ${points[i + 1]}`;
      }
    }
    return path;
  }

  private static wrapText(text: string, maxWidth: number, fontSize: number): string {
    // Simple text wrapping for SVG
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    const charWidth = fontSize * 0.6; // Approximate character width
    const maxCharsPerLine = Math.floor(maxWidth / charWidth);

    for (const word of words) {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines.map((line, index) => 
      `<tspan x="${10}" dy="${index === 0 ? 0 : fontSize + 2}">${this.escapeXml(line)}</tspan>`
    ).join('');
  }

  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private static getNodesBounds(nodes: Konva.Node[]): { x: number; y: number; width: number; height: number } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      const box = node.getClientRect();
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private static downloadDataURL(dataURL: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private static downloadURL(url: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const exportCanvasAsPNG = (stage: Konva.Stage, filename?: string) => {
  return CanvasExporter.exportCanvas(stage, { format: 'png', filename });
};

export const exportCanvasAsJPG = (stage: Konva.Stage, filename?: string) => {
  return CanvasExporter.exportCanvas(stage, { format: 'jpg', filename });
};

export const exportCanvasAsPDF = (stage: Konva.Stage, filename?: string) => {
  return CanvasExporter.exportCanvas(stage, { format: 'pdf', filename });
};

export const exportCanvasAsSVG = (stage: Konva.Stage, filename?: string) => {
  return CanvasExporter.exportCanvas(stage, { format: 'svg', filename });
};