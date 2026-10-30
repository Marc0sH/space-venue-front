export interface SpaceImage{
    idSpaceImages: number,
    fileName: string,
    // Es la key del archivo en S3 (media/spaces/{idSpace}/...), no una URL completa
    urlImage: string,
    dateSend: Date
}

export interface ImageUploadUrl{
    uploadUrl: string,
    key: string
}
