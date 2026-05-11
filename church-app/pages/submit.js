import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import {
  HiUpload, HiX, HiDocumentText, HiPhotograph, HiVideoCamera,
  HiLink, HiMinusSm, HiCode, HiRefresh, HiSave, HiPencil,
} from 'react-icons/hi'
import { v4 as uuidv4 } from 'uuid'

// ─── Rich-Text Toolbar Config ────────────────────────────────────────────────
const FONT_FAMILIES = [
  'DM Sans', 'Crimson Pro', 'Cinzel', 'Georgia', 'Arial',
  'Times New Roman', 'Trebuchet MS', 'Verdana', 'Courier New',
]
const FONT_SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '64']
const LINE_SPACINGS = ['1', '1.25', '1.5', '1.75', '2', '2.5', '3']

function execCmd(cmd, val = null) {
  document.execCommand(cmd, false, val)
}

// ─── Toolbar Button ───────────────────────────────────────────────────────────
function TBtn({ title, onClick, active, children, danger }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className={`flex items-center justify-center w-7 h-7 rounded text-xs font-bold transition-all select-none
        ${active ? 'bg-brand-600 text-white shadow' : danger ? 'hover:bg-red-50 hover:text-red-600 text-slate-500' : 'hover:bg-slate-100 text-slate-600'}`}
    >
      {children}
    </button>
  )
}

function TSep() {
  return <div className="w-px h-5 bg-slate-200 mx-0.5 self-center flex-shrink-0" />
}

function TSelect({ value, onChange, options, title, width = 'w-28' }) {
  return (
    <select
      title={title}
      value={value}
      onChange={e => onChange(e.target.value)}
      onMouseDown={e => e.stopPropagation()}
      className={`${width} h-7 px-1.5 text-xs font-ui border border-slate-200 rounded bg-white text-slate-700 cursor-pointer hover:border-brand-400 focus:outline-none focus:border-brand-500 transition-colors`}
    >
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  )
}

// ─── Link Modal ───────────────────────────────────────────────────────────────
function LinkModal({ onInsert, onClose }) {
  const [url, setUrl] = useState('https://')
  const [text, setText] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadeUp">
        <h3 className="font-ui font-bold text-slate-800 mb-4">Insert Hyperlink</h3>
        <div className="space-y-3">
          <div>
            <label className="block font-ui text-xs text-slate-500 mb-1">Display Text</label>
            <input value={text} onChange={e => setText(e.target.value)} className="input" placeholder="Link text (optional)" />
          </div>
          <div>
            <label className="block font-ui text-xs text-slate-500 mb-1">URL *</label>
            <input value={url} onChange={e => setUrl(e.target.value)} className="input" placeholder="https://…" />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 font-ui text-sm text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100">Cancel</button>
          <button type="button" onClick={() => onInsert(url, text)} className="px-4 py-2 font-ui text-sm bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700">Insert</button>
        </div>
      </div>
    </div>
  )
}

// ─── YouTube Modal ────────────────────────────────────────────────────────────
function YouTubeModal({ onInsert, onClose }) {
  const [ytUrl, setYtUrl] = useState('')
  function getYtId(url) {
    const m = url.match(/(?:v=|\/v\/|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/)
    return m ? m[1] : null
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadeUp">
        <h3 className="font-ui font-bold text-slate-800 mb-4">Embed YouTube Video</h3>
        <input value={ytUrl} onChange={e => setYtUrl(e.target.value)} className="input" placeholder="https://www.youtube.com/watch?v=…" />
        <div className="flex gap-2 justify-end mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 font-ui text-sm text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100">Cancel</button>
          <button type="button" onClick={() => { const id = getYtId(ytUrl); if (id) onInsert(id); else toast.error('Invalid YouTube URL') }}
            className="px-4 py-2 font-ui text-sm bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600">Embed</button>
        </div>
      </div>
    </div>
  )
}

// ─── Rich Text Editor ─────────────────────────────────────────────────────────
function RichEditor({ value, onChange, uploadImageFn }) {
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)
  const [activeFormats, setActiveFormats] = useState({})
  const [fontFamily, setFontFamily] = useState('DM Sans')
  const [fontSize, setFontSize] = useState('16')
  const [lineSpacing, setLineSpacing] = useState('1.5')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showYtModal, setShowYtModal] = useState(false)
  const savedRangeRef = useRef(null)

  // Init with existing value
  useEffect(() => {
    if (editorRef.current && value !== undefined && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, []) // eslint-disable-line

  // Save selection before opening modals
  function saveSelection() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange()
  }
  function restoreSelection() {
    const sel = window.getSelection()
    if (savedRangeRef.current && sel) {
      sel.removeAllRanges()
      sel.addRange(savedRangeRef.current)
    }
    editorRef.current?.focus()
  }

  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      justifyFull: document.queryCommandState('justifyFull'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    })
  }, [])

  function handleInput() {
    updateActiveFormats()
    onChange(editorRef.current?.innerHTML || '')
  }

  function applyFontFamily(val) {
    setFontFamily(val)
    editorRef.current?.focus()
    execCmd('fontName', val)
  }
  function applyFontSize(val) {
    setFontSize(val)
    editorRef.current?.focus()
    execCmd('fontSize', '7') // placeholder size
    // Replace font size 7 spans with actual px value
    editorRef.current?.querySelectorAll('font[size="7"]').forEach(el => {
      el.removeAttribute('size')
      el.style.fontSize = `${val}px`
    })
  }
  function applyLineSpacing(val) {
    setLineSpacing(val)
    editorRef.current?.style && (editorRef.current.style.lineHeight = val)
    // Apply to selected paragraphs/divs too
    const sel = window.getSelection()
    if (sel?.rangeCount) {
      const range = sel.getRangeAt(0)
      const ancestor = range.commonAncestorContainer
      const block = ancestor.nodeType === 1 ? ancestor : ancestor.parentElement
      if (block && editorRef.current?.contains(block)) {
        block.style.lineHeight = val
      }
    }
  }
  function applyHeading(tag) {
    editorRef.current?.focus()
    execCmd('formatBlock', tag)
  }

  // Image upload via toolbar button
  async function handleImageUpload(file) {
    if (!file) return
    toast.loading('Uploading image…', { id: 'imgup' })
    try {
      const url = await uploadImageFn(file)
      restoreSelection()
      const imgHtml = `<figure class="rte-figure" contenteditable="false" style="display:inline-block;max-width:100%;margin:8px 0;position:relative">
        <img src="${url}" alt="" style="max-width:100%;border-radius:8px;display:block" class="rte-img" />
        <figcaption contenteditable="true" style="font-size:13px;color:#64748b;text-align:center;padding:4px 8px;font-family:DM Sans,sans-serif;border:1px dashed #e2e8f0;border-top:none;border-radius:0 0 6px 6px;outline:none;min-width:80px" placeholder="Add a caption…">Caption</figcaption>
      </figure>`
      execCmd('insertHTML', imgHtml)
      toast.success('Image inserted!', { id: 'imgup' })
    } catch {
      toast.error('Image upload failed', { id: 'imgup' })
    }
  }

  // Drag-and-drop images
  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (file?.type.startsWith('image/')) handleImageUpload(file)
  }

  function handleLinkInsert(url, text) {
    restoreSelection()
    const linkText = text.trim() || url
    execCmd('insertHTML', `<a href="${url}" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:underline">${linkText}</a>`)
    setShowLinkModal(false)
  }
  function handleYtInsert(ytId) {
    restoreSelection()
    const html = `<div class="rte-yt" contenteditable="false" style="position:relative;padding-bottom:56.25%;height:0;margin:12px 0;border-radius:12px;overflow:hidden;background:#000">
      <iframe style="position:absolute;inset:0;width:100%;height:100%"
        src="https://www.youtube.com/embed/${ytId}?rel=0"
        frameborder="0" allowfullscreen></iframe>
    </div>`
    execCmd('insertHTML', html)
    setShowYtModal(false)
  }

  const HEADING_OPTS = [
    { value: 'p', label: 'Paragraph' },
    { value: 'h1', label: 'Heading 1' },
    { value: 'h2', label: 'Heading 2' },
    { value: 'h3', label: 'Heading 3' },
    { value: 'h4', label: 'Heading 4' },
    { value: 'h5', label: 'Heading 5' },
    { value: 'h6', label: 'Heading 6' },
    { value: 'blockquote', label: 'Blockquote' },
    { value: 'pre', label: 'Code Block' },
  ]

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm focus-within:border-brand-400 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all">
      {/* ── Toolbar ── */}
      <div className="bg-slate-50 border-b border-slate-200 px-2 py-1.5 flex flex-wrap items-center gap-0.5 select-none">

        {/* Undo / Redo */}
        <TBtn title="Undo (Ctrl+Z)" onClick={() => execCmd('undo')}>↩</TBtn>
        <TBtn title="Redo (Ctrl+Y)" onClick={() => execCmd('redo')}>↪</TBtn>
        <TSep />

        {/* Block format */}
        <TSelect
          title="Block format"
          value="p"
          onChange={applyHeading}
          options={HEADING_OPTS}
          width="w-28"
        />
        <TSep />

        {/* Font family */}
        <TSelect
          title="Font family"
          value={fontFamily}
          onChange={applyFontFamily}
          options={FONT_FAMILIES}
          width="w-28"
        />

        {/* Font size */}
        <TSelect
          title="Font size"
          value={fontSize}
          onChange={applyFontSize}
          options={FONT_SIZES.map(s => ({ value: s, label: `${s}px` }))}
          width="w-16"
        />
        <TSep />

        {/* Inline formats */}
        <TBtn title="Bold (Ctrl+B)" active={activeFormats.bold} onClick={() => execCmd('bold')}><b>B</b></TBtn>
        <TBtn title="Italic (Ctrl+I)" active={activeFormats.italic} onClick={() => execCmd('italic')}><i>I</i></TBtn>
        <TBtn title="Underline (Ctrl+U)" active={activeFormats.underline} onClick={() => execCmd('underline')}><u>U</u></TBtn>
        <TBtn title="Strikethrough" active={activeFormats.strikeThrough} onClick={() => execCmd('strikeThrough')}><s>S</s></TBtn>
        <TSep />

        {/* Color */}
        <label title="Text color" className="flex items-center justify-center w-7 h-7 rounded hover:bg-slate-100 cursor-pointer transition-all" >
          <span className="text-xs font-bold text-slate-600 relative">
            A
            <input type="color" defaultValue="#1e293b" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              onChange={e => { editorRef.current?.focus(); execCmd('foreColor', e.target.value) }} />
          </span>
        </label>
        <label title="Highlight color" className="flex items-center justify-center w-7 h-7 rounded hover:bg-slate-100 cursor-pointer transition-all">
          <span className="text-xs font-bold relative" style={{ background: 'linear-gradient(transparent 60%, #fde047 60%)' }}>
            H
            <input type="color" defaultValue="#fde047" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              onChange={e => { editorRef.current?.focus(); execCmd('hiliteColor', e.target.value) }} />
          </span>
        </label>
        <TSep />

        {/* Lists */}
        <TBtn title="Bullet List" active={activeFormats.insertUnorderedList} onClick={() => execCmd('insertUnorderedList')}>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><circle cx="2" cy="4" r="1.5"/><rect x="5" y="3.25" width="9" height="1.5" rx=".75"/><circle cx="2" cy="8" r="1.5"/><rect x="5" y="7.25" width="9" height="1.5" rx=".75"/><circle cx="2" cy="12" r="1.5"/><rect x="5" y="11.25" width="9" height="1.5" rx=".75"/></svg>
        </TBtn>
        <TBtn title="Numbered List" active={activeFormats.insertOrderedList} onClick={() => execCmd('insertOrderedList')}>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><text x="1" y="5" fontSize="5" fontWeight="bold">1.</text><rect x="6" y="3.25" width="8" height="1.5" rx=".75"/><text x="1" y="9" fontSize="5" fontWeight="bold">2.</text><rect x="6" y="7.25" width="8" height="1.5" rx=".75"/><text x="1" y="13" fontSize="5" fontWeight="bold">3.</text><rect x="6" y="11.25" width="8" height="1.5" rx=".75"/></svg>
        </TBtn>
        <TSep />

        {/* Alignment */}
        <TBtn title="Align Left" active={activeFormats.justifyLeft} onClick={() => execCmd('justifyLeft')}>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><rect x="1" y="2" width="14" height="1.5" rx=".75"/><rect x="1" y="5.5" width="10" height="1.5" rx=".75"/><rect x="1" y="9" width="14" height="1.5" rx=".75"/><rect x="1" y="12.5" width="8" height="1.5" rx=".75"/></svg>
        </TBtn>
        <TBtn title="Align Center" active={activeFormats.justifyCenter} onClick={() => execCmd('justifyCenter')}>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><rect x="1" y="2" width="14" height="1.5" rx=".75"/><rect x="3" y="5.5" width="10" height="1.5" rx=".75"/><rect x="1" y="9" width="14" height="1.5" rx=".75"/><rect x="4" y="12.5" width="8" height="1.5" rx=".75"/></svg>
        </TBtn>
        <TBtn title="Align Right" active={activeFormats.justifyRight} onClick={() => execCmd('justifyRight')}>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><rect x="1" y="2" width="14" height="1.5" rx=".75"/><rect x="5" y="5.5" width="10" height="1.5" rx=".75"/><rect x="1" y="9" width="14" height="1.5" rx=".75"/><rect x="7" y="12.5" width="8" height="1.5" rx=".75"/></svg>
        </TBtn>
        <TBtn title="Justify" active={activeFormats.justifyFull} onClick={() => execCmd('justifyFull')}>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><rect x="1" y="2" width="14" height="1.5" rx=".75"/><rect x="1" y="5.5" width="14" height="1.5" rx=".75"/><rect x="1" y="9" width="14" height="1.5" rx=".75"/><rect x="1" y="12.5" width="14" height="1.5" rx=".75"/></svg>
        </TBtn>
        <TSep />

        {/* Indent */}
        <TBtn title="Increase Indent" onClick={() => execCmd('indent')}>→|</TBtn>
        <TBtn title="Decrease Indent" onClick={() => execCmd('outdent')}>|←</TBtn>
        <TSep />

        {/* Line spacing */}
        <TSelect
          title="Line spacing"
          value={lineSpacing}
          onChange={applyLineSpacing}
          options={LINE_SPACINGS.map(v => ({ value: v, label: `${v}× spacing` }))}
          width="w-24"
        />
        <TSep />

        {/* Horizontal rule */}
        <TBtn title="Insert Horizontal Line" onClick={() => execCmd('insertHorizontalRule')}>
          <HiMinusSm size={14} />
        </TBtn>

        {/* Hyperlink */}
        <TBtn title="Insert Link" onClick={() => { saveSelection(); setShowLinkModal(true) }}>
          <HiLink size={13} />
        </TBtn>

        {/* Image */}
        <TBtn title="Insert Image" onClick={() => { saveSelection(); fileInputRef.current?.click() }}>
          <HiPhotograph size={13} />
        </TBtn>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) { saveSelection(); handleImageUpload(f) }; e.target.value = '' }} />

        {/* YouTube */}
        <TBtn title="Embed YouTube" onClick={() => { saveSelection(); setShowYtModal(true) }}>
          <HiVideoCamera size={13} />
        </TBtn>

        {/* Remove formatting */}
        <TSep />
        <TBtn title="Clear Formatting" onClick={() => execCmd('removeFormat')} danger>
          <HiCode size={13} />
        </TBtn>
      </div>

      {/* ── Editor Area ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{ lineHeight: lineSpacing, fontFamily, fontSize: `${fontSize}px`, minHeight: '380px' }}
        className="p-5 bg-white outline-none text-slate-800 font-body [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-2.5 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_h4]:font-display [&_h4]:text-lg [&_h4]:font-bold [&_h5]:font-display [&_h5]:text-base [&_h5]:font-bold [&_h6]:font-display [&_h6]:text-sm [&_h6]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-brand-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_pre]:bg-slate-900 [&_pre]:text-green-400 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-sm [&_a]:text-brand-600 [&_a]:underline [&_hr]:border-slate-200 [&_hr]:my-4 [&_img]:max-w-full [&_img]:rounded-lg [&_figure]:my-3"
        data-placeholder="Start writing your article here… Drag and drop images directly into the editor."
      />

      {/* Modals */}
      {showLinkModal && <LinkModal onInsert={handleLinkInsert} onClose={() => setShowLinkModal(false)} />}
      {showYtModal && <YouTubeModal onInsert={handleYtInsert} onClose={() => setShowYtModal(false)} />}

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          font-style: italic;
        }
        [contenteditable] figcaption:empty:before {
          content: 'Add a caption…';
          color: #94a3b8;
        }
        .rte-figure { resize: both; overflow: auto; }
      `}</style>
    </div>
  )
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ content }) {
  const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const words = plain ? plain.split(/\s+/).length : 0
  const chars = plain.length
  const readMins = Math.max(1, Math.round(words / 200))
  return (
    <div className="flex items-center gap-4 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-ui text-slate-400">
      <span><b className="text-slate-600">{words.toLocaleString()}</b> words</span>
      <span><b className="text-slate-600">{chars.toLocaleString()}</b> chars</span>
      <span>~<b className="text-slate-600">{readMins}</b> min read</span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SubmitPage({ user, profile, authReady }) {
  const router = useRouter()
  const { edit: editId } = router.query

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'
  const isEditMode = !!editId && isAdmin

  const [form, setForm] = useState({
    title: '', category: 'sermon', summary: '', content: '',
    youtube_url: '', allow_download: true,
    author_name: '', author_email: '',
  })
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [existingCoverUrl, setExistingCoverUrl] = useState(null)
  const [pdfFile, setPdfFile] = useState(null)
  const [existingPdf, setExistingPdf] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)

  const DRAFT_KEY = isEditMode ? `church_draft_edit_${editId}` : 'church_draft_new'

  // ── Load existing publication for editing ──────────────────────────────────
  useEffect(() => {
    if (!editId || !authReady) return
    if (!isAdmin) { toast.error('Admin access required to edit'); router.push('/'); return }
    setLoadingEdit(true)
    supabase.from('publications').select('*').eq('id', editId).single().then(({ data, error }) => {
      if (error || !data) { toast.error('Publication not found'); router.push('/admin'); return }
      setForm({
        title: data.title || '',
        category: data.category || 'sermon',
        summary: data.summary || '',
        content: data.content || '',
        youtube_url: data.youtube_url || '',
        allow_download: data.allow_download ?? true,
        author_name: data.author_name || '',
        author_email: data.author_email || '',
      })
      if (data.cover_image_url) { setCoverPreview(data.cover_image_url); setExistingCoverUrl(data.cover_image_url) }
      if (data.pdf_url) setExistingPdf({ url: data.pdf_url, filename: data.pdf_filename })
      setLoadingEdit(false)
    })
  }, [editId, authReady]) // eslint-disable-line

  // ── Auto-save draft ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authReady || loadingEdit) return
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, ts: Date.now() }))
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 2000)
    }, 2000)
    return () => clearTimeout(timer)
  }, [form]) // eslint-disable-line

  // ── Restore draft on new submissions ──────────────────────────────────────
  useEffect(() => {
    if (isEditMode || !authReady) return
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      try {
        const { form: f, ts } = JSON.parse(saved)
        // Only restore drafts less than 7 days old
        if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000) {
          setForm(f)
          toast('Draft restored from auto-save', { icon: '📝', duration: 3000 })
        }
      } catch { /* ignore */ }
    }
  }, [authReady]) // eslint-disable-line

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleCover(e) {
    const f = e.target.files[0]
    if (!f) return
    setCoverFile(f)
    setCoverPreview(URL.createObjectURL(f))
    setExistingCoverUrl(null)
  }

  async function uploadFile(bucket, file, folder = '') {
    const ext = file.name.split('.').pop()
    const path = `${folder}${uuidv4()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return { url: data.publicUrl, filename: file.name, path }
  }

  async function uploadInlineImage(file) {
    const res = await uploadFile('publication-images', file, 'inline/')
    return res.url
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.summary.trim() || !form.content.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }
    if (!isEditMode && !user && (!form.author_name.trim() || !form.author_email.trim())) {
      toast.error('Please provide your name and email.')
      return
    }

    setLoading(true)
    try {
      let cover_image_url = existingCoverUrl
      let pdf_url = existingPdf?.url || null
      let pdf_filename = existingPdf?.filename || null

      if (coverFile) {
        const res = await uploadFile('publication-covers', coverFile)
        cover_image_url = res.url
      }
      if (pdfFile) {
        const res = await uploadFile('publication-pdfs', pdfFile)
        pdf_url = res.url
        pdf_filename = res.filename
      }

      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        content: form.content.trim(),
        category: form.category,
        youtube_url: form.youtube_url.trim() || null,
        allow_download: form.allow_download,
        cover_image_url,
        pdf_url,
        pdf_filename,
      }

      if (isEditMode) {
        // Edit existing publication
        const { error } = await supabase.from('publications').update({
          ...payload,
          updated_at: new Date().toISOString(),
        }).eq('id', editId)
        if (error) throw error
        localStorage.removeItem(DRAFT_KEY)
        toast.success('Publication updated successfully! ✅')
        router.push(`/publication/${editId}`)
      } else {
        // New submission
        const { error } = await supabase.from('publications').insert({
          ...payload,
          author_id: user?.id || null,
          author_name: user ? (profile?.full_name || null) : form.author_name.trim(),
          author_email: user ? user.email : form.author_email.trim(),
          status: 'pending',
        })
        if (error) throw error
        localStorage.removeItem(DRAFT_KEY)
        setSubmitted(true)
        toast.success('Submitted! Our team will review it shortly.')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Submitted success screen ───────────────────────────────────────────────
  if (submitted) {
    return (
      <>
        <Head><title>Submitted — Three Angels Publications</title></Head>
        <Navbar user={user} profile={profile} />
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-slate-900 mb-3">Submission Received!</h2>
            <p className="font-ui text-slate-500 mb-6">Thank you for sharing. Our admin team will review your submission and publish it once approved.</p>
            <div className="flex gap-3 justify-center">
              <a href="/" className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-ui font-semibold text-sm hover:bg-brand-700 transition-colors">
                Back to Publications
              </a>
              <button onClick={() => setSubmitted(false)} className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-ui font-semibold text-sm hover:bg-slate-50 transition-colors">
                Submit Another
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (loadingEdit) {
    return (
      <>
        <Head><title>Loading… — Three Angels Publications</title></Head>
        <Navbar user={user} profile={profile} />
        <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl" />)}
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{isEditMode ? 'Edit Publication' : 'Submit Article'} — Three Angels Publications</title>
      </Head>
      <Navbar user={user} profile={profile} />

      {/* Page header */}
      <div className="hero-pattern text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            {isEditMode
              ? <><HiPencil size={24} className="text-gold-400" /><h1 className="font-display text-4xl font-bold">Edit Publication</h1></>
              : <h1 className="font-display text-4xl font-bold">Submit a Publication</h1>
            }
          </div>
          <p className="font-ui text-blue-200">
            {isEditMode
              ? 'Update the content below. Changes will be reflected on the site immediately.'
              : 'Share your sermon, testimony, devotional or Bible study. All submissions are reviewed before publishing.'
            }
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Author info (only if not logged in + not editing) */}
          {!user && !isEditMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <h3 className="font-ui font-bold text-sm text-amber-800 uppercase tracking-wide mb-4">Your Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Your Name *">
                  <input value={form.author_name} onChange={e => set('author_name', e.target.value)}
                    className="input" placeholder="Full name" required />
                </Field>
                <Field label="Email Address *">
                  <input type="email" value={form.author_email} onChange={e => set('author_email', e.target.value)}
                    className="input" placeholder="your@email.com" required />
                </Field>
              </div>
              <p className="font-ui text-xs text-amber-700 mt-3">
                💡 <a href="/" className="underline">Sign in or register</a> to track your submissions.
              </p>
            </div>
          )}

          {/* Article basics */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h3 className="font-ui font-bold text-sm text-slate-500 uppercase tracking-wide">Article Details</h3>

            <Field label="Title *">
              <input value={form.title} onChange={e => set('title', e.target.value)}
                className="input" placeholder="Enter a descriptive title…" required />
            </Field>

            <Field label="Category *">
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input">
                <option value="devotional">Devotional</option>
                <option value="sermon">Sermon</option>
                <option value="study">Bible Study</option>
                <option value="Health">Health</option>
                <option value="testimony">Testimony</option>
                <option value="news">Church News</option>
                <option value="review">Book Review</option>
              </select>
            </Field>

            <Field label="Short Summary *" hint="2–3 sentences describing the article">
              <textarea value={form.summary} onChange={e => set('summary', e.target.value)}
                className="input min-h-[80px] resize-y" placeholder="Brief description…" required />
            </Field>
          </div>

          {/* Rich Text Editor */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-ui font-bold text-sm text-slate-500 uppercase tracking-wide">Full Content *</h3>
              <div className="flex items-center gap-3">
                {draftSaved && (
                  <span className="flex items-center gap-1.5 font-ui text-xs text-green-600 animate-fadeUp">
                    <HiSave size={12} /> Draft auto-saved
                  </span>
                )}
                <StatsBar content={form.content} />
              </div>
            </div>
            <RichEditor
              value={form.content}
              onChange={v => set('content', v)}
              uploadImageFn={uploadInlineImage}
            />
            <p className="font-ui text-xs text-slate-400">
              Tip: Drag &amp; drop images directly into the editor. Use the toolbar to format, insert videos, and add hyperlinks.
            </p>
          </div>

          {/* Media */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h3 className="font-ui font-bold text-sm text-slate-500 uppercase tracking-wide">Attachments &amp; Media</h3>

            {/* Cover image */}
            <div>
              <label className="flex items-center gap-2 font-ui text-sm font-semibold text-slate-700 mb-2">
                <HiPhotograph className="text-brand-500" /> Cover Image
              </label>
              {coverPreview ? (
                <div className="relative rounded-xl overflow-hidden h-48 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); setExistingCoverUrl(null) }}
                    className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-slate-500 hover:text-red-500">
                    <HiX size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors">
                  <HiUpload className="text-slate-300 mb-2" size={28} />
                  <span className="font-ui text-sm text-slate-400">Click to upload cover image</span>
                  <span className="font-ui text-xs text-slate-300 mt-1">JPG, PNG, WebP · Max 5MB</span>
                  <input type="file" accept="image/*" onChange={handleCover} className="hidden" />
                </label>
              )}
            </div>

            {/* PDF */}
            <div>
              <label className="flex items-center gap-2 font-ui text-sm font-semibold text-slate-700 mb-2">
                <HiDocumentText className="text-amber-500" /> Attach PDF Document
              </label>
              {(pdfFile || existingPdf) ? (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-ui text-sm font-semibold text-slate-800 truncate">
                      {pdfFile ? pdfFile.name : existingPdf?.filename}
                    </div>
                    <div className="font-ui text-xs text-slate-400">
                      {pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(1)} MB` : 'Currently attached'}
                    </div>
                  </div>
                  <button type="button" onClick={() => { setPdfFile(null); setExistingPdf(null) }} className="text-slate-400 hover:text-red-500">
                    <HiX size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-amber-300 hover:bg-amber-50 transition-colors">
                  <span className="font-ui text-sm text-slate-400">Click to upload a PDF</span>
                  <span className="font-ui text-xs text-slate-300 mt-1">PDF only · Max 50MB</span>
                  <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files[0] || null)} className="hidden" />
                </label>
              )}
              {(pdfFile || existingPdf) && (
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input type="checkbox" checked={form.allow_download} onChange={e => set('allow_download', e.target.checked)}
                    className="w-4 h-4 accent-brand-600" />
                  <span className="font-ui text-sm text-slate-600">Allow readers to download this PDF</span>
                </label>
              )}
            </div>

            {/* YouTube */}
            <div>
              <label className="flex items-center gap-2 font-ui text-sm font-semibold text-slate-700 mb-2">
                <HiVideoCamera className="text-red-500" /> YouTube Video Link
              </label>
              <input value={form.youtube_url} onChange={e => set('youtube_url', e.target.value)}
                className="input" placeholder="https://www.youtube.com/watch?v=…" />
              {form.youtube_url && (
                <p className="font-ui text-xs text-slate-400 mt-1.5">The video will be embedded in the article.</p>
              )}
            </div>
          </div>

          {/* Submit / Update */}
          <div className="flex items-center gap-4">
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-ui font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 text-sm">
              {loading
                ? <><HiRefresh className="animate-spin" size={16} /> {isEditMode ? 'Saving changes…' : 'Uploading & Submitting…'}</>
                : isEditMode
                  ? <><HiSave size={16} /> Save Changes</>
                  : '✉ Submit for Review'
              }
            </button>
            {isEditMode
              ? <button type="button" onClick={() => router.push('/admin')}
                  className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-ui font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              : <p className="font-ui text-sm text-slate-400">You'll be notified once it's approved.</p>
            }
          </div>

        </form>
      </div>
    </>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block font-ui text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label} {hint && <span className="normal-case font-normal text-slate-400 ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  )
}
