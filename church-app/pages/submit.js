import { useState } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { HiUpload, HiX, HiDocumentText, HiPhotograph, HiVideoCamera } from 'react-icons/hi'
import { v4 as uuidv4 } from 'uuid'

export default function SubmitPage({ user, profile, authReady }) {
  const [form, setForm] = useState({
    title: '', category: 'sermon', summary: '', content: '',
    youtube_url: '', allow_download: true,
    author_name: '', author_email: '',
  })
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [pdfFile, setPdfFile] = useState(null)
  const [imageFiles, setImageFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleCover(e) {
    const f = e.target.files[0]
    if (!f) return
    setCoverFile(f)
    setCoverPreview(URL.createObjectURL(f))
  }

  function handleImages(e) {
    const files = Array.from(e.target.files).slice(0, 6)
    setImageFiles(files)
  }

  async function uploadFile(bucket, file, folder = '') {
    const ext = file.name.split('.').pop()
    const path = `${folder}${uuidv4()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return { url: data.publicUrl, filename: file.name, path }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.summary.trim() || !form.content.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }
    // Require name/email if not logged in
    if (!user && (!form.author_name.trim() || !form.author_email.trim())) {
      toast.error('Please provide your name and email.')
      return
    }

    setLoading(true)
    try {
      let cover_image_url = null, pdf_url = null, pdf_filename = null

      if (coverFile) {
        const res = await uploadFile('publication-covers', coverFile)
        cover_image_url = res.url
      }
      if (pdfFile) {
        const res = await uploadFile('publication-pdfs', pdfFile)
        pdf_url = res.url
        pdf_filename = res.filename
      }

      const { data: pub, error } = await supabase.from('publications').insert({
        title: form.title.trim(),
        summary: form.summary.trim(),
        content: form.content.trim(),
        category: form.category,
        youtube_url: form.youtube_url.trim() || null,
        allow_download: form.allow_download,
        author_id: user?.id || null,
        author_name: user ? (profile?.full_name || null) : form.author_name.trim(),
        author_email: user ? user.email : form.author_email.trim(),
        cover_image_url,
        pdf_url,
        pdf_filename,
        status: 'pending',
      }).select().single()

      if (error) throw error

      // Upload inline images
      if (imageFiles.length > 0 && pub) {
        const imgUploads = await Promise.all(
          imageFiles.map(f => uploadFile('publication-images', f))
        )
        await supabase.from('publication_images').insert(
          imgUploads.map(u => ({ publication_id: pub.id, url: u.url, caption: '' }))
        )
      }

      setSubmitted(true)
      toast.success('Submitted! Our team will review it shortly.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <>
      <Head><title>Submit Article — Three Angels Publications</title></Head>
      <Navbar user={user} profile={profile} />

      {/* Page header */}
      <div className="hero-pattern text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl font-bold mb-3">Submit a Publication</h1>
          <p className="font-ui text-blue-200">Share your sermon, testimony, devotional or Bible study. All submissions are reviewed before publishing.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Author info (only if not logged in) */}
          {!user && (
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

            <Field label="Full Content *">
              <textarea value={form.content} onChange={e => set('content', e.target.value)}
                className="input min-h-[280px] resize-y" placeholder="Write your full article here…" required />
            </Field>
          </div>

          {/* Media */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h3 className="font-ui font-bold text-sm text-slate-500 uppercase tracking-wide">Attachments & Media</h3>

            {/* Cover image */}
            <div>
              <label className="flex items-center gap-2 font-ui text-sm font-semibold text-slate-700 mb-2">
                <HiPhotograph className="text-brand-500" /> Cover Image
              </label>
              {coverPreview ? (
                <div className="relative rounded-xl overflow-hidden h-48 bg-slate-100">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null) }}
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

            {/* Article images */}
            <div>
              <label className="flex items-center gap-2 font-ui text-sm font-semibold text-slate-700 mb-2">
                <HiPhotograph className="text-purple-500" /> Article Images <span className="text-slate-400 font-normal">(up to 6)</span>
              </label>
              {imageFiles.length > 0 ? (
                <div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {imageFiles.map((f, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden aspect-video bg-slate-100">
                        <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setImageFiles([])} className="font-ui text-xs text-red-500 hover:underline">Remove all images</button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-colors">
                  <span className="font-ui text-sm text-slate-400">Click to upload inline images</span>
                  <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
                </label>
              )}
            </div>

            {/* PDF */}
            <div>
              <label className="flex items-center gap-2 font-ui text-sm font-semibold text-slate-700 mb-2">
                <HiDocumentText className="text-amber-500" /> Attach PDF Document
              </label>
              {pdfFile ? (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-ui text-sm font-semibold text-slate-800 truncate">{pdfFile.name}</div>
                    <div className="font-ui text-xs text-slate-400">{(pdfFile.size / 1024 / 1024).toFixed(1)} MB</div>
                  </div>
                  <button type="button" onClick={() => setPdfFile(null)} className="text-slate-400 hover:text-red-500">
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
              {pdfFile && (
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

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button type="submit" disabled={loading}
              className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-ui font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 text-sm">
              {loading ? 'Uploading & Submitting…' : '✉ Submit for Review'}
            </button>
            <p className="font-ui text-sm text-slate-400">You'll be notified once it's approved.</p>
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
