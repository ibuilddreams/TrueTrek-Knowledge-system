def build_absolute_image_url(request, image_field):
    if not image_field:
        return None
    if request is not None:
        return request.build_absolute_uri(image_field.url)
    return image_field.url
