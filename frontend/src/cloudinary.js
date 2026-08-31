// ============================================================
// CLOUDINARY SETUP
// ============================================================
export const CLOUDINARY_CLOUD_NAME = "ulstkpyi";
export const CLOUDINARY_UPLOAD_PRESET = "skypost";

export function openImageUpload(onSuccess, onError, { square = false } = {}) {
  if (!window.cloudinary) {
    onError?.("Image upload script hasn't loaded yet. Refresh the page and try again.");
    return;
  }

  const widget = window.cloudinary.createUploadWidget(
    {
      cloudName: CLOUDINARY_CLOUD_NAME,
      uploadPreset: CLOUDINARY_UPLOAD_PRESET,
      sources: ["local", "camera"],
      multiple: false,
      cropping: true,
      ...(square ? { croppingAspectRatio: 1 } : {}),
    },
    (err, result) => {
      if (err) {
        // Surfaces the EXACT cloud/preset being used, so a mismatch
        // against the Cloudinary dashboard is immediately visible
        // instead of a generic "it doesn't work" error.
        onError?.(
          `Upload failed (cloud: "${CLOUDINARY_CLOUD_NAME}", preset: "${CLOUDINARY_UPLOAD_PRESET}"). ` +
          `Check that a preset with exactly this name exists in your Cloudinary dashboard ` +
          `under Settings -> Upload -> Upload presets, and that its Signing Mode is "Unsigned".`
        );
        return;
      }
      if (result && result.event === "success") {
        onSuccess(result.info.secure_url);
      }
    }
  );
  widget.open();
}
