import html2canvas from 'html2canvas'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function captureAndShare(
  element: HTMLElement,
  filename: string,
  { forceDownload = false } = {},
): Promise<void> {
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

      if (!forceDownload && navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Quiniela Expertos del Mundial 2026' })
        } catch (err) {
          if ((err as Error).name === 'AbortError') { resolve(); return }
          reject(err); return
        }
      } else {
        downloadBlob(blob, filename)
      }
      resolve()
    }, 'image/png')
  })
}
