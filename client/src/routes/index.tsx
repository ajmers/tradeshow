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
      {
        path: 'booth-planner/:boothId/walls/:wallId',
        lazy: () => import('@/pages/WallDetailPage').then((m) => ({ Component: m.WallDetailPage })),
      },
      {
        path: 'booth-planner-3d',
        lazy: () => import('@/pages/Booth3DPlannerPage').then((m) => ({ Component: m.Booth3DPlannerPage })),
      },
      {
        path: 'booth-planner-3d/:boothId',
        lazy: () => import('@/pages/Booth3DDetailPage').then((m) => ({ Component: m.Booth3DDetailPage })),
      },
      {
        path: 'admin',
        lazy: () => import('@/pages/AdminPage').then((m) => ({ Component: m.AdminPage })),
      },
      {
        path: 'label-printer',
        lazy: () => import('@/pages/LabelPrinterPage').then((m) => ({ Component: m.LabelPrinterPage })),
      },
    ],
  },
])
