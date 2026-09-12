import { useEffect, useRef } from 'react'
import { DiffEditor, type DiffEditorProps, type DiffOnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

/**
 * DiffEditor wrapper that avoids Monaco's teardown race:
 * "TextModel got disposed before DiffEditorWidget model got reset"
 * (@monaco-editor/react disposes models before the widget).
 *
 * Keep the models alive during library cleanup, then dispose them after
 * React has finished unmounting the DiffEditor child.
 */
export function SafeDiffEditor(props: DiffEditorProps) {
  const modelsRef = useRef<{
    original: editor.ITextModel | null
    modified: editor.ITextModel | null
  }>({ original: null, modified: null })

  useEffect(() => {
    return () => {
      const { original, modified } = modelsRef.current
      modelsRef.current = { original: null, modified: null }
      queueMicrotask(() => {
        if (original && !original.isDisposed()) original.dispose()
        if (modified && !modified.isDisposed()) modified.dispose()
      })
    }
  }, [])

  const onMount: DiffOnMount = (diffEditor, monaco) => {
    const model = diffEditor.getModel()
    modelsRef.current = {
      original: model?.original ?? null,
      modified: model?.modified ?? null,
    }
    props.onMount?.(diffEditor, monaco)
  }

  return (
    <DiffEditor
      {...props}
      keepCurrentOriginalModel
      keepCurrentModifiedModel
      onMount={onMount}
    />
  )
}
