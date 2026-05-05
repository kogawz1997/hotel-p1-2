'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TopBar } from '@/components/layout/top-bar';
import { toast } from 'sonner';
import { Image, Upload, Trash2, Eye, Star, Palette, Type, FileText } from 'lucide-react';
import Link from 'next/link';

export function BrandingClient({ hotel, gallery }: { hotel: any; gallery: any[] }) {
  const supabase = createClient();
  const [h, setH] = useState(hotel);
  const [gal, setGal] = useState(gallery);
  const [showEdit, setShowEdit] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [editForm, setEditForm] = useState({
    name: h.name || '',
    description: h.description || '',
    tagline: h.tagline || '',
    logo_url: h.logo_url || '',
    hero_image_url: h.hero_image_url || '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function uploadImage(file: File, type: 'logo' | 'hero' | 'gallery') {
    setUploading(true);
    const fileName = `${h.id}/${type}/${Date.now()}-${file.name}`;
    const { error: uploadError, data } = await supabase.storage
      .from('hotel-assets')
      .upload(fileName, file, { upsert: false });

    setUploading(false);
    if (uploadError) { toast.error('Upload ไม่สำเร็จ'); return null; }

    const { data: { publicUrl } } = supabase.storage
      .from('hotel-assets')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, 'logo');
    if (url) {
      setEditForm(p => ({ ...p, logo_url: url }));
      toast.success('Logo อัพโหลดแล้ว');
    }
  }

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, 'hero');
    if (url) {
      setEditForm(p => ({ ...p, hero_image_url: url }));
      toast.success('Hero image อัพโหลดแล้ว');
    }
  }

  async function saveChanges() {
    setSaving(true);
    const { error } = await supabase.from('hotels').update({
      name: editForm.name,
      description: editForm.description,
      tagline: editForm.tagline,
      logo_url: editForm.logo_url,
      hero_image_url: editForm.hero_image_url,
    }).eq('id', h.id);
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    setH(editForm);
    setShowEdit(false);
    toast.success('บันทึกเรียบร้อย');
  }

  async function uploadGalleryImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, 'gallery');
    if (url) {
      const { data, error } = await supabase.from('hotel_gallery').insert({
        hotel_id: h.id,
        image_url: url,
        display_order: gal.length,
        alt_text: file.name,
      }).select().single();
      if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
      setGal(p => [...p, data]);
      toast.success('เพิ่มรูปเรียบร้อย');
    }
  }

  async function deleteGalleryImage(id: string) {
    const { error } = await supabase.from('hotel_gallery').delete().eq('id', id);
    if (error) { toast.error('ลบไม่สำเร็จ'); return; }
    setGal(p => p.filter(g => g.id !== id));
    toast.success('ลบรูปเรียบร้อย');
  }

  async function setFeaturedImage(id: string) {
    const { error } = await supabase.from('hotels').update({ featured_gallery_id: id }).eq('id', h.id);
    if (error) { toast.error('อัพเดตไม่สำเร็จ'); return; }
    setH(p => ({ ...p, featured_gallery_id: id }));
    toast.success('ตั้งเป็น featured image เรียบร้อย');
  }

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar
        title="Branding & Gallery"
        description="จัดการลวดลายโรงแรม รูปภาพ และตัวตนแบรนด์"
        action={
          <Link href="/booking/preview">
            <Button size="sm" variant="outline">
              <Eye className="h-3.5 w-3.5" /> ตัวอย่างเว็บ
            </Button>
          </Link>
        }
      />

      {/* Basic Info */}
      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm flex items-center gap-2"><Type className="h-4 w-4" />ข้อมูลพื้นฐาน</CardTitle>
          <Button size="sm" onClick={() => setShowEdit(true)}>แก้ไข</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">ชื่อโรงแรม</div>
            <div className="font-medium">{h.name}</div>
          </div>
          {h.tagline && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Tagline</div>
              <div className="text-sm">{h.tagline}</div>
            </div>
          )}
          {h.description && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">คำอธิบาย</div>
              <div className="text-sm line-clamp-3">{h.description}</div>
            </div>
          )}
          {h.logo_url && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">Logo</div>
              <img src={h.logo_url} alt="logo" className="h-10 object-contain" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hero Image Preview */}
      {h.hero_image_url && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">Hero Image</CardTitle></CardHeader>
          <CardContent>
            <div className="relative w-full h-48 bg-secondary rounded-lg overflow-hidden">
              <img src={h.hero_image_url} alt="hero" className="w-full h-full object-cover" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gallery */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm flex items-center gap-2"><Image className="h-4 w-4" />Gallery ({gal.length})</CardTitle>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" onChange={uploadGalleryImage} className="hidden" disabled={uploading} />
            <Button size="sm" asChild>
              <span><Upload className="h-3.5 w-3.5" /> {uploading ? 'อัพโหลด...' : 'เพิ่มรูป'}</span>
            </Button>
          </label>
        </CardHeader>
        <CardContent>
          {gal.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              ยังไม่มีรูปในแกลเลอรี
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gal.map(img => (
                <div key={img.id} className="relative group">
                  <img src={img.image_url} alt={img.alt_text} className="w-full h-32 object-cover rounded-lg" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => setFeaturedImage(img.id)}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-red-500/30"
                      onClick={() => deleteGalleryImage(img.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {h.featured_gallery_id === img.id && (
                    <div className="absolute top-2 left-2 bg-accent text-white text-2xs px-2 py-0.5 rounded">Featured</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>แก้ไข Branding</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">ชื่อโรงแรม *</label>
              <input
                value={editForm.name}
                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tagline</label>
              <input
                value={editForm.tagline}
                onChange={e => setEditForm(p => ({ ...p, tagline: e.target.value }))}
                placeholder="เช่น Comfort Meets Thai Hospitality"
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">คำอธิบาย</label>
              <textarea
                value={editForm.description}
                onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                rows={4}
                placeholder="เรื่องราวโรงแรมและสิ่งที่ทำให้พิเศษ"
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-2">
                <Image className="h-3 w-3" /> Logo
              </label>
              {editForm.logo_url && <img src={editForm.logo_url} alt="logo" className="h-8 mb-2" />}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <span>{uploading ? 'อัพโหลด...' : 'เลือกรูป'}</span>
                </Button>
              </label>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-2">
                <Palette className="h-3 w-3" /> Hero Image
              </label>
              {editForm.hero_image_url && (
                <img src={editForm.hero_image_url} alt="hero" className="w-full h-24 object-cover rounded-lg mb-2" />
              )}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" disabled={uploading} />
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <span>{uploading ? 'อัพโหลด...' : 'เลือกรูป'}</span>
                </Button>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>ยกเลิก</Button>
            <Button onClick={saveChanges} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
