import Konva from 'konva'

export interface ExportOptions {
    format: 'png' | 'jpeg' | 'svg'
    quality?: number
    pixelRatio?: number
    filename?: string
}

export function exportCanvas(stage: Konva.Stage, options: ExportOptions = { format: 'png' }) {
    const {
        format = 'png',
        quality = 1,
        pixelRatio = 2,
        filename = `canvas-${new Date().toISOString().split('T')[0]}`
    } = options

    try {
        let dataURL: string

        switch (format) {
            case 'png':
                dataURL = stage.toDataURL({
                    mimeType: 'image/png',
                    quality,
                    pixelRatio
                })
                break
            case 'jpeg':
                dataURL = stage.toDataURL({
                    mimeType: 'image/jpeg',
                    quality,
                    pixelRatio
                })
                break
            case 'svg':
                // SVG export is not directly supported by Konva stage
                // For now, fallback to PNG
                dataURL = stage.toDataURL({
                    mimeType: 'image/png',
                    quality,
                    pixelRatio
                })
                break
            default:
                throw new Error(`Unsupported format: ${format}`)
        }

        // Create download link
        const link = document.createElement('a')
        link.download = `${filename}.${format}`
        link.href = dataURL
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Clean up object URL for SVG
        if (format === 'svg') {
            URL.revokeObjectURL(dataURL)
        }

        console.log(`Canvas exported as ${format.toUpperCase()}`)
        return true
    } catch (error) {
        console.error('Export failed:', error)
        return false
    }
}

export function exportCanvasAsPNG(stage: Konva.Stage, filename?: string) {
    return exportCanvas(stage, { format: 'png', filename })
}

export function exportCanvasAsJPEG(stage: Konva.Stage, filename?: string) {
    return exportCanvas(stage, { format: 'jpeg', filename })
}

export function exportCanvasAsSVG(stage: Konva.Stage, filename?: string) {
    return exportCanvas(stage, { format: 'svg', filename })
}