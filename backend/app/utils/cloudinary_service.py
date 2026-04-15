import os

from app.config import Config

try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
except ImportError:  # pragma: no cover
    cloudinary = None

ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024


class CloudinaryServiceError(ValueError):
    pass


def _ensure_cloudinary_config():
    if cloudinary is None:
        raise CloudinaryServiceError("cloudinary package is not installed.")

    missing = [
        name
        for name, value in (
            ("CLOUDINARY_CLOUD_NAME", Config.CLOUDINARY_CLOUD_NAME),
            ("CLOUDINARY_API_KEY", Config.CLOUDINARY_API_KEY),
            ("CLOUDINARY_API_SECRET", Config.CLOUDINARY_API_SECRET),
        )
        if not value
    ]

    if missing:
        raise CloudinaryServiceError(
            "Missing Cloudinary configuration: " + ", ".join(missing)
        )

    cloudinary.config(
        cloud_name=Config.CLOUDINARY_CLOUD_NAME,
        api_key=Config.CLOUDINARY_API_KEY,
        api_secret=Config.CLOUDINARY_API_SECRET,
        secure=True,
    )


def _validate_image_file(file):
    filename = getattr(file, "filename", "") or ""
    extension = os.path.splitext(filename)[1].lower().lstrip(".")

    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise CloudinaryServiceError(
            "Invalid image type. Allowed types: jpg, jpeg, png, webp."
        )

    stream = getattr(file, "stream", file)
    current_position = stream.tell()
    stream.seek(0, os.SEEK_END)
    file_size = stream.tell()
    stream.seek(current_position)

    if file_size > MAX_IMAGE_SIZE_BYTES:
        raise CloudinaryServiceError(
            "Image file is too large. Maximum size is 10 MB."
        )


def upload_image(file, *, folder):
    _ensure_cloudinary_config()
    _validate_image_file(file)

    try:
        upload_result = cloudinary.uploader.upload(file, folder=folder)
    except Exception as exc:  # pragma: no cover
        raise CloudinaryServiceError(f"Cloudinary upload failed: {exc}") from exc

    url = upload_result.get("secure_url") or upload_result.get("url")
    public_id = upload_result.get("public_id")

    if not url or not public_id:
        raise CloudinaryServiceError(
            "Cloudinary upload did not return url and public_id."
        )

    return {
        "url": url,
        "public_id": public_id,
    }


def delete_image(public_id):
    if not public_id:
        return

    _ensure_cloudinary_config()

    try:
        result = cloudinary.uploader.destroy(public_id)
    except Exception as exc:  # pragma: no cover
        raise CloudinaryServiceError(f"Cloudinary delete failed: {exc}") from exc

    if result.get("result") not in {"ok", "not found"}:
        raise CloudinaryServiceError(
            f"Unexpected Cloudinary delete response for {public_id}: {result}"
        )
