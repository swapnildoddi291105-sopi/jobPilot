import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { useAuth } from "./useAuth"

function mapResume(r) {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    fileName: r.file_name,
    fileSize: r.file_size,
    mimeType: r.mime_type,
    driveFileId: r.drive_file_id,
    driveWebViewLink: r.drive_web_view_link,
    extractedText: r.extracted_text,
    atsScore: r.ats_score,
    targetRole: r.target_role,
    parsedSkills: r.parsed_skills,
    parsedEmail: r.parsed_email,
    parsedPhone: r.parsed_phone,
    parsedExperienceYears: r.parsed_experience_years,
    parsedSummary: r.parsed_summary,
    dateUploaded: r.created_at,
    dateUpdated: r.updated_at,
    size: r.file_size ? `${(r.file_size / 1024).toFixed(0)} KB` : null,
  }
}

export function useResumes({ sortBy = "date", order = "desc" } = {}) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ["resumes", sortBy, order],
    queryFn: () =>
      api
        .get("/resumes", { params: { sortBy, order } })
        .then((r) => {
          const data = Array.isArray(r.data) ? r.data : (r.data?.resumes || [])
          return data.map(mapResume)
        }),
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  })
}

export function useUploadResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, onProgress }) => {
      const formData = new FormData()
      formData.append("file", file)
      return api
        .post("/upload/resume", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (onProgress && e.total) {
              onProgress(Math.round((e.loaded * 100) / e.total))
            }
          },
        })
        .then((r) => r.data)
    },
    onSuccess: () => qc.invalidateQueries(["resumes"]),
  })
}

export function useDeleteResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/resumes/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries(["resumes"]),
  })
}

export function useUpdateResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }) => api.patch(`/resumes/${id}`, updates).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries(["resumes"]),
  })
}
