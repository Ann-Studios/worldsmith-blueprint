import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
    format: 'json' | 'png' | 'pdf' | 'svg';
    includeConnections?: boolean;
    includeComments?: boolean;
    quality?: number;
}

export const exportCanvas = async (
    canvasElement: HTMLElement,
    boardName: string,
    options: ExportOptions,
    data?: any
) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `worldsmith-${boardName.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}`;

    switch (options.format) {
        case 'json':
            return exportAsJSON(data, filename);
        case 'png':
            return exportAsPNG(canvasElement, filename, options.quality);
        case 'pdf':
            return exportAsPDF(canvasElement, filename, options.quality);
        case 'svg':
            return exportAsSVG(canvasElement, filename);
        default:
            throw new Error(`Unsupported export format: ${options.format}`);
    }
};

const exportAsJSON = (data: any, filename: string) => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
};

const exportAsPNG = async (canvasElement: HTMLElement, filename: string, quality: number = 1) => {
    const canvas = await html2canvas(canvasElement, {
        backgroundColor: '#ffffff',
        scale: quality,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        width: canvasElement.scrollWidth,
        height: canvasElement.scrollHeight,
    });

    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
};

const exportAsPDF = async (canvasElement: HTMLElement, filename: string, quality: number = 1) => {
    const canvas = await html2canvas(canvasElement, {
        backgroundColor: '#ffffff',
        scale: quality,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        width: canvasElement.scrollWidth,
        height: canvasElement.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
};

const exportAsSVG = (canvasElement: HTMLElement, filename: string) => {
    // Create SVG representation of the canvas
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', canvasElement.scrollWidth.toString());
    svg.setAttribute('height', canvasElement.scrollHeight.toString());
    svg.setAttribute('viewBox', `0 0 ${canvasElement.scrollWidth} ${canvasElement.scrollHeight}`);

    // Add background
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', '#ffffff');
    svg.appendChild(rect);

    // Convert canvas content to SVG (simplified version)
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.svg`;
    link.click();
    URL.revokeObjectURL(url);
};
