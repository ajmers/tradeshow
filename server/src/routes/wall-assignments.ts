import { Hono } from 'hono'
import { createWallAssignmentInputSchema, updateWallAssignmentInputSchema } from '@shared'
import {
  listWallAssignments,
  createWallAssignment,
  updateWallAssignment,
  deleteWallAssignment,
} from '@/services/wallAssignments.service'
import { requireAuth } from '@/middleware/auth'
import type { AppEnv } from '@/lib/hono'

export const wallAssignmentsRoute = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const assignments = await listWallAssignments(c.get('airtableBaseId'))
    return c.json(assignments)
  })
  .post('/', async (c) => {
    const input = createWallAssignmentInputSchema.parse(await c.req.json())
    const assignment = await createWallAssignment(c.get('airtableBaseId'), input)
    return c.json(assignment, 201)
  })
  .patch('/:id', async (c) => {
    const input = updateWallAssignmentInputSchema.parse(await c.req.json())
    const assignment = await updateWallAssignment(c.get('airtableBaseId'), c.req.param('id'), input)
    return c.json(assignment)
  })
  .delete('/:id', async (c) => {
    await deleteWallAssignment(c.get('airtableBaseId'), c.req.param('id'))
    return c.body(null, 204)
  })
