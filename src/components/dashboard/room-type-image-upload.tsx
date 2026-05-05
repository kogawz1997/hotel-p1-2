'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Upload, Trash2, Star, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RoomTypeImageUpload({ hotelId, roomTypeId, onClose }: {
  hotelId: string; roomTypeId: string; onClose: () => void;
}) {
  const supabase = createClient();
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/room-types/${roomTypeId}/images`)
      .then(r => r.json())
      .then(d => { setImages(d.images || []); setLoading(false); });
  }, [roomTypeId]);

  async function upload(file: File) {
    setUploading(true);
    const path = `${hotelId}/room-types/${roomTypeId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('hotel-assets').upload(path, file, { upsert: false });
    if (error) { toast.error('Upload ล้มเหลว'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('hotel-assets').getPublicUrl(path);
    const res = await fetch(`/api/room-types/${roomTypeId}/images`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: publicUrl, altText: file.name, displayOrder: images.length }),
    });
    const data = await res.json();
    setImages(p => [...p, data.image]);
    setUploading(false);
    toast.success('เพิ่มรูปแล้ว');
  }

  async function deleteImage(imageId: string) {
    await fetch(`/api/room-types/${roomTypeId}/images?imageId=${imageId}`, { method: 'DELETE' });
    setImages(p => p.filter(i => i.id !== imageId));
    toast.success('ลบรูปแล้ว');
  }

  async function reorder(from: number, to: number) {
    const newImages = [...images];
    const [moved] = newImages.splice(from, 1);
    newImages.splice(to, 0, moved);
    setImages(newImages);
    // Update display_order
    for (let i = 0; i < newImages.length; i++) {
      await supabase.from('room_type_images').update({ display_order: i }).eq('id', newImages[i].id);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-xl rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold">รูปภาพห้องพัก</h3>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5">
          {/* Upload zone */}
          <label className={cn(
            'flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors mb-4',
            uploading ? 'border-accent/50 bg-accent/5' : 'border-border hover:border-accent/30 hover:bg-secondary/30'
          )}>
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={e => { Array.from(e.target.files || []).forEach(upload); }}
              disabled={uploading} />
            {uploading ? (
              <span className="h-5 w-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">{uploading ? 'กำลังอัพโหลด...' : 'คลิกหรือลากรูปมาวาง'}</span>
          </label>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-secondary rounded-xl animate-pulse" />)}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">ยังไม่มีรูปภาพ</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, i) => (
                <div key={img.id} className="relative group rounded-xl overflow-hidden">
                  <img src={img.image_url} alt={img.alt_text} className="w-full h-32 object-cover" />
                  {i === 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-accent text-white text-2xs px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Star className="h-2.5 w-2.5 fill-current" /> หลัก
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {i > 0 && (
                      <button onClick={() => reorder(i, 0)}
                        className="p-1.5 bg-white/90 rounded-lg text-xs hover:bg-white">
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteImage(img.id)}
                      className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
}
