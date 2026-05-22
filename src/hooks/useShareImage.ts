import html2canvas from 'html2canvas'

export async function captureAndShare(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: null,
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob(async blob => {
      if (!blob) { reject(new Error('No se pudo capturar la imagen')); return }

      const file = new File([blob], `${filename}.png`, { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Quiniela Expertos del Mundial 2026' })
        } catch (err) {
          if ((err as Error).name === 'AbortError') { resolve(); return }
          reject(err); return
        }
      } else {
        // Fallback: descargar la imagen directamente
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      resolve()
    }, 'image/png')
  })
}
