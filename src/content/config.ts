import { z, defineCollection } from 'astro:content';

const test = defineCollection({
  schema: z.object({
    title: z.string(),
  })
})
  
export const collections = {
  test
}