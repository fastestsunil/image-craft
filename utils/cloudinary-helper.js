export default class CloudinaryHelper {
  constructor(cloudName, uploadPreset) {
    this.cloudName = cloudName;
    this.uploadPreset = uploadPreset;
    this.baseUrl = `https://api.cloudinary.com/v1_1/${cloudName}`;
  }

  async uploadImage(imageUrl, options = {}) {
    const formData = new FormData();
    formData.append('file', imageUrl);
    formData.append('upload_preset', this.uploadPreset);

    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });

    const response = await fetch(`${this.baseUrl}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    return response.json();
  }

  async convertFormat(imageUrl, format) {
    return this.uploadImage(imageUrl, {
      format: format,
      quality: 'auto:best',
      fetch_format: 'auto',
    });
  }

  async removeBackground(imageUrl) {
    return this.uploadImage(imageUrl, {
      background_removal: 'cloudinary_ai',
      format: 'png',
    });
  }

  async applyTransformation(imageUrl, transformations) {
    const transformString = this.buildTransformString(transformations);
    return this.uploadImage(imageUrl, {
      transformation: transformString,
    });
  }

  buildTransformString(transformations) {
    const transforms = [];

    if (transformations.width) {
      transforms.push(`w_${transformations.width}`);
    }
    if (transformations.height) {
      transforms.push(`h_${transformations.height}`);
    }
    if (transformations.crop) {
      transforms.push(`c_${transformations.crop}`);
    }
    if (transformations.quality) {
      transforms.push(`q_${transformations.quality}`);
    }
    if (transformations.effect) {
      transforms.push(`e_${transformations.effect}`);
    }

    return transforms.join(',');
  }

  getOptimizedUrl(publicId, options = {}) {
    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload`;
    const transforms = this.buildTransformString(options);

    if (transforms) {
      return `${baseUrl}/${transforms}/${publicId}`;
    }

    return `${baseUrl}/${publicId}`;
  }

  validateCredentials() {
    if (!this.cloudName || !this.uploadPreset) {
      throw new Error('Cloudinary credentials not configured');
    }
  }
}
