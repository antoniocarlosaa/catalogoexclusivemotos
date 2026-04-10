import { supabase } from './supabase';

export class StorageService {
    private bucketName = 'vehicle-media';
    private imgbbKey = import.meta.env.VITE_IMGBB_API_KEY;

    // Upload de arquivo (imagem ou vídeo)
    async uploadFile(file: File, folder: 'images' | 'videos'): Promise<{ url: string | null; error: Error | null }> {
        try {
            // Se for imagem e tivermos a chave do ImgBB, envia pra lá
            if (file.type.startsWith('image/') && this.imgbbKey) {
                const formData = new FormData();
                formData.append('image', file);
                
                const response = await fetch(`https://api.imgbb.com/1/upload?key=${this.imgbbKey}`, {
                    method: 'POST',
                    body: formData,
                });
                
                const data = await response.json();
                
                if (data.success) {
                    return { url: data.data.url, error: null };
                } else {
                    throw new Error(data.error?.message || 'Erro desconhecido no ImgBB');
                }
            }

            // Fallback para Supabase (para vídeos ou se não houver chave ImgBB)
            const fileExt = file.name.split('.').pop();
            const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from(this.bucketName)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Obter URL pública do Supabase
            const { data: { publicUrl } } = supabase.storage
                .from(this.bucketName)
                .getPublicUrl(data.path);

            return { url: publicUrl, error: null };
        } catch (error) {
            console.error('Erro no upload:', error);
            return { url: null, error: error as Error };
        }
    }

    // Upload de múltiplos arquivos
    async uploadMultipleFiles(files: File[], folder: 'images' | 'videos'): Promise<{ urls: string[]; errors: Error[] }> {
        const results = await Promise.all(
            files.map(file => this.uploadFile(file, folder))
        );

        const urls = results.filter(r => r.url).map(r => r.url!);
        const errors = results.filter(r => r.error).map(r => r.error!);

        return { urls, errors };
    }

    // Deletar arquivo
    async deleteFile(fileUrl: string): Promise<{ error: Error | null }> {
        try {
            // Se for do ImgBB (não é possível deletar facilmente via API anônima sem guardar o delete_url, então apenas ignoramos)
            if (fileUrl.includes('ibb.co')) {
               console.log('Arquivo hospedado no ImgBB (remoção ignorada)');
               return { error: null };
            }

            // Extrair o path do arquivo da URL (Supabase)
            const urlParts = fileUrl.split(`/${this.bucketName}/`);
            if (urlParts.length < 2) {
                // Pode não ser do supabase, apenas silenciosamente retorna
                return { error: null };
            }

            const filePath = urlParts[1];

            const { error } = await supabase.storage
                .from(this.bucketName)
                .remove([filePath]);

            if (error) throw error;

            return { error: null };
        } catch (error) {
            console.error('Erro ao deletar arquivo:', error);
            return { error: error as Error };
        }
    }

    // Deletar múltiplos arquivos
    async deleteMultipleFiles(fileUrls: string[]): Promise<{ errors: Error[] }> {
        const results = await Promise.all(
            fileUrls.map(url => this.deleteFile(url))
        );

        const errors = results.filter(r => r.error).map(r => r.error!);
        return { errors };
    }
}

export const storageService = new StorageService();
