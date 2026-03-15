'use client'

import { IconDownload } from '@tabler/icons-react'

export function PDFViewer({ id }: { id: string }) {
  const pdfUrl = `/assets/pdf/${id}.pdf`

  return (
    <div className="relative flex h-full max-h-full flex-col overflow-hidden">
      <div className="flex justify-end bg-light-background dark:bg-dark-background">
        <a
          className="flex items-center gap-2 px-4 py-2 font-medium"
          download={`${id}.pdf`}
          href={pdfUrl}
        >
          <IconDownload stroke={2} />
          <span>Download</span>
        </a>
      </div>

      <iframe
        className="h-full w-full flex-1 border-0 bg-light-background dark:bg-dark-background"
        src={pdfUrl}
        title={`${id} PDF preview`}
      />
    </div>
  )
}
