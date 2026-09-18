import type { FrameData, GalleryLayoutSettings } from "../types/gallery";
import { LayoutCreator } from "./LayoutCreator";

/**
 * Gallery frames: the layout slots from LayoutCreator with one image url stamped on each.
 * The layout math itself lives in LayoutCreator so scene objects can share it.
 */
export class GalleryCreator {
    static generateGallery(imageUrls: string[], settings: GalleryLayoutSettings): FrameData[] {
        return LayoutCreator.generate(imageUrls.length, settings).map((slot, i) => ({
            url: imageUrls[i],
            position: slot.position,
            rotation: slot.rotation ?? [0, 0, 0],
            ...(slot.scale ? { scale: slot.scale } : {}),
            videoSrc: null,
        }));
    }
}
