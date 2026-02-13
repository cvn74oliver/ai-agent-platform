// Temporary stub for image_gen helper
export const image_gen = {
  async text2im(_: any) {
    // Mimic the OpenAI Images API response shape
    return [
      {
        url: "https://example.com/stubbed-image.png",
      },
    ]
  },
}