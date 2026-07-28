import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { GalleryPage } from '@/pages/GalleryPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <GalleryPage /> },
      {
        path: 'booth-planner',
        lazy: () => import('@/pages/BoothPlannerPage').then((m) => ({ Component: m.BoothPlannerPage })),
      },
      {
        path: 'booth-planner/:boothId',
        lazy: () => import('@/pages/BoothDetailPage').then((m) => ({ Component: m.BoothDetailPage })),
      },
    ],
  },
])
