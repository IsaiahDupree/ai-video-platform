/**
 * OpenAPI 3.0 Specification for Remotion Media Service
 *
 * Auto-generated documentation with all endpoints, schemas, and examples
 */

import { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Remotion Media Service',
    version: '1.0.0',
    description: `
REST API microservice for AI-powered video generation, text-to-speech, image generation, and avatar creation.

## Features

- **Video Rendering** - Generate videos from JSON briefs with Remotion
- **Text-to-Speech** - Voice synthesis and cloning with ElevenLabs, OpenAI, IndexTTS2
- **AI Video Generation** - Text-to-video with Sora, LTX-Video, Mochi, Wan2.2
- **Image Generation** - AI character creation with DALL-E
- **Audio Processing** - Music search, mixing, and SFX application
- **Avatar Generation** - Talking heads with InfiniteTalk
- **Template System** - Extract and render static ad templates

## Authentication

All endpoints require API key authentication via:
- **Header:** \`X-API-Key: your-api-key\`
- **Or Bearer:** \`Authorization: Bearer your-api-key\`

## Rate Limits

- 60 requests per minute
- 1000 requests per hour

## Job Queue

Most operations are async and return a job ID. Poll \`GET /api/v1/jobs/{id}\` for status.
    `,
    contact: {
      name: 'Remotion VideoStudio',
      url: 'https://github.com/remotion-dev/remotion',
    },
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3100',
      description: 'Local development server',
    },
  ],
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
  tags: [
    { name: 'Health', description: 'Service health and status' },
    { name: 'Jobs', description: 'Job queue management' },
    { name: 'Render', description: 'Video and image rendering' },
    { name: 'TTS', description: 'Text-to-speech generation' },
    { name: 'Video', description: 'AI video generation' },
    { name: 'Image', description: 'AI image generation' },
    { name: 'Avatar', description: 'Talking avatar generation' },
    { name: 'Audio', description: 'Audio processing' },
    { name: 'Template', description: 'Ad template extraction and rendering' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Basic health check endpoint (no auth required)',
        security: [],
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness check',
        description: 'Detailed readiness check with queue statistics',
        responses: {
          '200': {
            description: 'Service is ready',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ready' },
                    uptime: { type: 'number', description: 'Uptime in seconds' },
                    queue: {
                      type: 'object',
                      properties: {
                        pending: { type: 'number' },
                        processing: { type: 'number' },
                        completed: { type: 'number' },
                        failed: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/capabilities': {
      get: {
        tags: ['Health'],
        summary: 'List capabilities',
        description: 'Get list of all available endpoints',
        responses: {
          '200': {
            description: 'List of capabilities',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    endpoints: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/jobs': {
      get: {
        tags: ['Jobs'],
        summary: 'List jobs',
        description: 'Get list of all jobs with optional filtering',
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] },
            description: 'Filter by job status',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 100 },
            description: 'Maximum number of jobs to return',
          },
        ],
        responses: {
          '200': {
            description: 'List of jobs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    jobs: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Job' },
                    },
                    total: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/jobs/{id}': {
      get: {
        tags: ['Jobs'],
        summary: 'Get job status',
        description: 'Get status and result of a specific job',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Job ID',
          },
        ],
        responses: {
          '200': {
            description: 'Job details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Job' },
              },
            },
          },
          '404': {
            description: 'Job not found',
          },
        },
      },
      delete: {
        tags: ['Jobs'],
        summary: 'Cancel job',
        description: 'Cancel a pending or processing job',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Job ID',
          },
        ],
        responses: {
          '200': {
            description: 'Job cancelled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Job cannot be cancelled',
          },
          '404': {
            description: 'Job not found',
          },
        },
      },
    },
    '/api/v1/render/brief': {
      post: {
        tags: ['Render'],
        summary: 'Render video from brief',
        description: 'Generate a video from a JSON content brief using Remotion',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['brief'],
                properties: {
                  brief: { $ref: '#/components/schemas/ContentBrief' },
                  quality: {
                    type: 'string',
                    enum: ['preview', 'production'],
                    default: 'production',
                    description: 'Render quality (affects CRF value)',
                  },
                  outputFormat: {
                    type: 'string',
                    enum: ['mp4', 'webm', 'mov'],
                    default: 'mp4',
                  },
                  webhookUrl: {
                    type: 'string',
                    format: 'uri',
                    description: 'URL to receive job completion webhook',
                  },
                },
              },
              examples: {
                simpleVideo: {
                  summary: 'Simple explainer video',
                  value: {
                    brief: {
                      id: 'my-video',
                      format: 'explainer_v1',
                      title: 'Why Rockets Use Staging',
                      settings: {
                        duration_sec: 60,
                        fps: 30,
                        resolution: { width: 1080, height: 1920 },
                        aspect_ratio: '9:16',
                      },
                      style: {
                        theme: 'dark',
                        primary_color: '#3b82f6',
                        secondary_color: '#8b5cf6',
                      },
                      sections: [],
                    },
                    quality: 'production',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Job created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    jobId: { type: 'string' },
                    status: { type: 'string', example: 'pending' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/render/batch': {
      post: {
        tags: ['Render'],
        summary: 'Batch render videos',
        description: 'Render multiple videos in parallel',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['briefs'],
                properties: {
                  briefs: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ContentBrief' },
                  },
                  quality: { type: 'string', enum: ['preview', 'production'] },
                  webhookUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Batch job created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    batchId: { type: 'string' },
                    jobIds: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/render/batch/{id}': {
      get: {
        tags: ['Render'],
        summary: 'Get batch status',
        description: 'Check status of a batch render job',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Batch status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    batchId: { type: 'string' },
                    status: { type: 'string' },
                    progress: {
                      type: 'object',
                      properties: {
                        completed: { type: 'number' },
                        failed: { type: 'number' },
                        total: { type: 'number' },
                      },
                    },
                    videos: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          jobId: { type: 'string' },
                          status: { type: 'string' },
                          videoPath: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/render/static-ad': {
      post: {
        tags: ['Render'],
        summary: 'Render static ad',
        description: 'Render a static ad image from a template',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['template'],
                properties: {
                  template: { $ref: '#/components/schemas/AdTemplate' },
                  bindings: {
                    type: 'object',
                    description: 'Text and asset bindings',
                  },
                  size: {
                    type: 'string',
                    enum: ['ig_feed', 'ig_story', 'fb_feed', 'custom'],
                  },
                  format: {
                    type: 'string',
                    enum: ['png', 'jpg'],
                    default: 'png',
                  },
                  webhookUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Job created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    jobId: { type: 'string' },
                    status: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/tts/generate': {
      post: {
        tags: ['TTS'],
        summary: 'Generate speech',
        description: 'Generate speech from text using OpenAI or ElevenLabs',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: { type: 'string', description: 'Text to convert to speech' },
                  provider: {
                    type: 'string',
                    enum: ['openai', 'elevenlabs'],
                    default: 'openai',
                  },
                  voice: {
                    type: 'string',
                    description: 'Voice ID or name (provider-specific)',
                  },
                  options: {
                    type: 'object',
                    properties: {
                      speed: { type: 'number', minimum: 0.25, maximum: 4.0 },
                      emotion: { type: 'string', enum: ['neutral', 'happy', 'sad', 'angry'] },
                    },
                  },
                  webhookUrl: { type: 'string', format: 'uri' },
                },
              },
              examples: {
                openai: {
                  summary: 'OpenAI TTS',
                  value: {
                    text: 'Hello, this is a test.',
                    provider: 'openai',
                    voice: 'alloy',
                  },
                },
                elevenlabs: {
                  summary: 'ElevenLabs TTS',
                  value: {
                    text: 'Welcome to the future.',
                    provider: 'elevenlabs',
                    voice: '21m00Tcm4TlvDq8ikWAM',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Job created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    jobId: { type: 'string' },
                    status: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/tts/voice-clone': {
      post: {
        tags: ['TTS'],
        summary: 'Clone voice',
        description: 'Clone a voice from reference audio using IndexTTS2',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text', 'referenceAudio'],
                properties: {
                  text: { type: 'string' },
                  referenceAudio: {
                    type: 'string',
                    description: 'Base64-encoded audio or file path',
                  },
                  emotion: {
                    type: 'string',
                    enum: ['neutral', 'happy', 'sad', 'angry', 'explaining'],
                  },
                  webhookUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Job created',
          },
        },
      },
    },
    '/api/v1/tts/multi-language': {
      post: {
        tags: ['TTS'],
        summary: 'Multi-language TTS',
        description: 'Generate speech in multiple languages',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['translations'],
                properties: {
                  translations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        language: { type: 'string' },
                        text: { type: 'string' },
                      },
                    },
                  },
                  provider: { type: 'string', enum: ['openai', 'elevenlabs'] },
                  webhookUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Job created',
          },
        },
      },
    },
    '/api/v1/video/generate': {
      post: {
        tags: ['Video'],
        summary: 'Generate AI video',
        description: 'Generate video from text prompt using AI models (Sora, LTX, Mochi, Wan2.2)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['prompt', 'model'],
                properties: {
                  prompt: { type: 'string', description: 'Text description of video' },
                  model: {
                    type: 'string',
                    enum: ['sora', 'ltx', 'mochi', 'wan2.2'],
                    description: 'AI model to use',
                  },
                  duration: { type: 'number', description: 'Duration in seconds' },
                  resolution: {
                    type: 'object',
                    properties: {
                      width: { type: 'number' },
                      height: { type: 'number' },
                    },
                  },
                  webhookUrl: { type: 'string', format: 'uri' },
                },
              },
              examples: {
                ltxVideo: {
                  summary: 'LTX-Video (fast)',
                  value: {
                    prompt: 'A rocket launching into space',
                    model: 'ltx',
                    duration: 5,
                  },
                },
                mochiVideo: {
                  summary: 'Mochi (photorealistic)',
                  value: {
                    prompt: 'A serene lake at sunset',
                    model: 'mochi',
                    duration: 6,
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Job created',
          },
        },
      },
    },
    '/api/v1/video/image-to-video': {
      post: {
        tags: ['Video'],
        summary: 'Image to video',
        description: 'Animate a static image into video',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['image', 'motionPrompt'],
                properties: {
                  image: {
                    type: 'string',
                    description: 'Base64-encoded image or URL',
                  },
                  motionPrompt: {
                    type: 'string',
                    description: 'Description of desired motion',
                  },
                  duration: { type: 'number' },
                  webhookUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Job created',
          },
        },
      },
    },
    '/api/v1/image/character': {
      post: {
        tags: ['Image'],
        summary: 'Generate AI character',
        description: 'Generate character images with DALL-E',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['prompt'],
                properties: {
                  prompt: { type: 'string' },
                  style: {
                    type: 'string',
                    enum: ['realistic', 'cartoon', 'anime', '3d'],
                  },
                  expressions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Generate multiple expressions',
                  },
                  webhookUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Job created',
          },
        },
      },
    },
    '/api/v1/avatar/infinitetalk': {
      post: {
        tags: ['Avatar'],
        summary: 'Generate talking avatar',
        description: 'Create lip-synced talking head video with InfiniteTalk',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['image', 'audio'],
                properties: {
                  image: {
                    type: 'string',
                    description: 'Base64-encoded portrait image',
                  },
                  audio: {
                    type: 'string',
                    description: 'Base64-encoded audio file',
                  },
                  profile: {
                    type: 'string',
                    enum: ['fast', 'balanced', 'quality'],
                    default: 'balanced',
                  },
                  webhookUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Job created',
          },
        },
      },
    },
    '/api/v1/audio/search-music': {
      post: {
        tags: ['Audio'],
        summary: 'Search music',
        description: 'Search for royalty-free background music',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query'],
                properties: {
                  query: { type: 'string' },
                  mood: { type: 'string' },
                  duration: { type: 'number' },
                  webhookUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Job created',
          },
        },
      },
    },
    '/api/v1/audio/mix': {
      post: {
        tags: ['Audio'],
        summary: 'Mix audio',
        description: 'Mix voice, music, and SFX into single audio file',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  voiceover: { type: 'string', description: 'Voice audio file path' },
                  music: { type: 'string' },
                  sfx: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        file: { type: 'string' },
                        time: { type: 'number' },
                      },
                    },
                  },
                  volumes: {
                    type: 'object',
                    properties: {
                      voice: { type: 'number', minimum: 0, maximum: 1 },
                      music: { type: 'number', minimum: 0, maximum: 1 },
                      sfx: { type: 'number', minimum: 0, maximum: 1 },
                    },
                  },
                  webhookUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Job created',
          },
        },
      },
    },
    '/api/v1/audio/sfx': {
      post: {
        tags: ['Audio'],
        summary: 'Apply SFX',
        description: 'Apply sound effects to timeline from SFX manifest',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['events'],
                properties: {
                  events: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        sfxId: { type: 'string' },
                        time: { type: 'number' },
                        volume: { type: 'number' },
                      },
                    },
                  },
                  webhookUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Job created',
          },
        },
      },
    },
    '/api/v1/template/upload': {
      post: {
        tags: ['Template'],
        summary: 'Upload reference image',
        description: 'Upload a reference ad image for template extraction',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: {
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file (PNG or JPEG)',
                  },
                  name: { type: 'string' },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Image uploaded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    imageId: { type: 'string' },
                    filePath: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/template/extract': {
      post: {
        tags: ['Template'],
        summary: 'Extract template',
        description: 'Extract ad template from uploaded image using AI',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['imageId'],
                properties: {
                  imageId: { type: 'string' },
                  model: {
                    type: 'string',
                    enum: ['gpt-4-vision', 'claude-opus', 'claude-sonnet'],
                    default: 'gpt-4-vision',
                  },
                  webhookUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Job created',
          },
        },
      },
    },
    '/api/v1/template/images': {
      get: {
        tags: ['Template'],
        summary: 'List uploaded images',
        description: 'Get list of all uploaded reference images',
        responses: {
          '200': {
            description: 'List of images',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    images: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          filePath: { type: 'string' },
                          size: { type: 'number' },
                          uploadedAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/template/images/{imageId}': {
      get: {
        tags: ['Template'],
        summary: 'Get image details',
        description: 'Get details of a specific uploaded image',
        parameters: [
          {
            name: 'imageId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Image details',
          },
          '404': {
            description: 'Image not found',
          },
        },
      },
      delete: {
        tags: ['Template'],
        summary: 'Delete image',
        description: 'Delete an uploaded reference image',
        parameters: [
          {
            name: 'imageId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Image deleted',
          },
          '404': {
            description: 'Image not found',
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for authentication. Can also use Authorization: Bearer {key}',
      },
    },
    schemas: {
      Job: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique job ID' },
          type: { type: 'string', description: 'Job type (e.g., render-brief, tts-generate)' },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
          },
          priority: {
            type: 'string',
            enum: ['urgent', 'high', 'normal', 'low'],
          },
          input: { type: 'object', description: 'Job input data' },
          result: { type: 'object', description: 'Job result (when completed)' },
          error: { type: 'string', description: 'Error message (when failed)' },
          progress: { type: 'number', minimum: 0, maximum: 100 },
          createdAt: { type: 'string', format: 'date-time' },
          startedAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time' },
          retries: { type: 'number' },
          maxRetries: { type: 'number' },
        },
      },
      ContentBrief: {
        type: 'object',
        required: ['id', 'format', 'settings', 'style', 'sections'],
        properties: {
          id: { type: 'string' },
          format: {
            type: 'string',
            enum: ['explainer_v1', 'shorts_v1', 'listicle_v1'],
          },
          version: { type: 'string' },
          metadata: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
            },
          },
          settings: {
            type: 'object',
            required: ['duration_sec', 'fps'],
            properties: {
              resolution: {
                type: 'object',
                properties: {
                  width: { type: 'number' },
                  height: { type: 'number' },
                },
              },
              fps: { type: 'number', default: 30 },
              duration_sec: { type: 'number' },
              aspect_ratio: {
                type: 'string',
                enum: ['9:16', '16:9', '1:1'],
              },
            },
          },
          style: {
            type: 'object',
            properties: {
              theme: { type: 'string', enum: ['dark', 'light'] },
              primary_color: { type: 'string' },
              secondary_color: { type: 'string' },
              accent_color: { type: 'string' },
              font_heading: { type: 'string' },
              font_body: { type: 'string' },
            },
          },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: {
                  type: 'string',
                  enum: ['intro', 'topic', 'list_item', 'outro'],
                },
                duration_sec: { type: 'number' },
                start_time_sec: { type: 'number' },
                content: { type: 'object' },
              },
            },
          },
        },
      },
      AdTemplate: {
        type: 'object',
        required: ['templateId', 'canvas', 'layers'],
        properties: {
          templateId: { type: 'string' },
          name: { type: 'string' },
          canvas: {
            type: 'object',
            required: ['width', 'height'],
            properties: {
              width: { type: 'number' },
              height: { type: 'number' },
              backgroundColor: { type: 'string' },
            },
          },
          layers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string', enum: ['text', 'image', 'shape'] },
                rect: {
                  type: 'object',
                  properties: {
                    x: { type: 'number' },
                    y: { type: 'number' },
                    width: { type: 'number' },
                    height: { type: 'number' },
                  },
                },
                zIndex: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
};
