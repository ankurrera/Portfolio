import UnifiedPhotoForm, { PhotoFormData } from './UnifiedPhotoForm';

export interface PhotoMetadata {
  caption?: string;
  photographer_name?: string;
  date_taken?: string;
  device_used?: string;
  year?: number;
  tags?: string[];
  credits?: string;
  camera_lens?: string;
  project_visibility?: string;
  external_links?: Array<{ title: string; url: string }>;
}

interface PhotoMetadataFormProps {
  metadata: PhotoMetadata;
  onMetadataChange: (metadata: PhotoMetadata) => void;
}

export default function PhotoMetadataForm({ metadata, onMetadataChange }: PhotoMetadataFormProps) {
  const handleChange = (data: PhotoFormData) => {
    onMetadataChange(data);
  };

  return (
    <UnifiedPhotoForm
      mode="add"
      initialData={metadata}
      onChange={handleChange}
    />
  );
}
