import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useState, useCallback, useRef } from "react"
import { useUploadResume } from "@/hooks/useResumes"

export function ResumeUploader() {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)
  const { mutate: uploadResume, isPending } = useUploadResume()

  const handleFiles = useCallback((files) => {
    for (const file of files) {
      if (!file.type.match(/pdf|msword|officedocument\.wordprocessingml/)) {
        setUploadedFiles(prev => [...prev, { file, error: new Error("Only PDF, DOC, and DOCX files are allowed"), status: "error" }])
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadedFiles(prev => [...prev, { file, error: new Error("File size must be less than 5MB"), status: "error" }])
        continue
      }
      setProgress(0)
      setUploading(true)
      uploadResume(
        { file, onProgress: setProgress },
        {
          onSuccess: (data) => {
            setUploadedFiles(prev => [...prev, { file, data, status: "success" }])
            setUploading(false)
          },
          onError: (error) => {
            setUploadedFiles(prev => [...prev, { file, error, status: "error" }])
            setUploading(false)
          },
        }
      )
    }
  }, [uploadResume])

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [handleFiles])

  const handleChange = useCallback((e) => {
    e.preventDefault()
    const files = Array.from(e.target.files)
    handleFiles(files)
    e.target.value = ""
  }, [handleFiles])

  const inProgress = isPending || uploading

  return (
    <Card
      className={cn(
        "border-dashed border-2 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
        dragActive && "border-primary bg-primary/10",
        inProgress && "pointer-events-none opacity-70"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <CardContent className="p-8 flex flex-col items-center justify-center gap-3">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-xl transition-colors",
            dragActive ? "bg-primary/20" : "bg-muted"
          )}
        >
          {inProgress ? (
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          ) : (
            <Upload className={cn("h-7 w-7", dragActive ? "text-primary" : "text-muted-foreground")} />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">
            {inProgress ? "Uploading..." : dragActive ? "Drop your resume here" : "Upload New Resume"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Drag & drop or click to browse. PDF, DOC, DOCX up to 5MB
          </p>
        </div>

        {/* Progress bar */}
        {inProgress && progress > 0 && (
          <div className="w-full max-w-xs">
            <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1">{progress}%</p>
          </div>
        )}

        <input
          ref={inputRef}
          id="resume-upload"
          type="file"
          accept=".pdf,.doc,.docx"
          multiple
          className="hidden"
          onChange={handleChange}
        />

        {/* Recent uploads */}
        {uploadedFiles.length > 0 && !inProgress && (
          <div className="w-full space-y-2 mt-4 pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground">Recent uploads:</p>
            {uploadedFiles.slice(-3).reverse().map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {item.status === "success" ? (
                  <>
                    <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                    <span className="text-green-600 truncate">{item.file.name}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span className="text-red-600 truncate">
                      {item.file.name} — {item.error?.message || "Failed"}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
