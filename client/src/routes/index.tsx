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
        lazy: () => import('@/pages/WallDetailPage').then((m) => ({ Component: m.WallDetailPage })),
      },
      {
        path: 'booth-planner/:boothId/walls/:wallId',
        lazy: () => import('@/pages/WallDetailPage').then((m) => ({ Component: m.WallDetailPage })),
      },
      {
        path: 'admin',
        lazy: () => import('@/pages/AdminPage').then((m) => ({ Component: m.AdminPage })),
      },
      {
        path: 'label-printer',
        lazy: () => import('@/pages/LabelPrinterPage').then((m) => ({ Component: m.LabelPrinterPage })),
      },
      {
        path: 'settings',
        lazy: () => import('@/pages/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
      },
    ],
  },
])
