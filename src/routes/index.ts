import {createRouter, createWebHashHistory} from 'vue-router'
import gettext from '../gettext'
import {useUserStore} from '@/pinia'

import {
    CloudOutlined,
    CodeOutlined,
    FileOutlined,
    FileTextOutlined,
    HomeOutlined,
    InfoCircleOutlined,
    SafetyCertificateOutlined,
    SettingOutlined,
    UserOutlined
} from '@ant-design/icons-vue'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

const {$gettext} = gettext

export const routes = [
    {
        path: '/',
        name: () => $gettext('Home'),
        component: () => import('@/layouts/BaseLayout.vue'),
        children: [
            {
                path: 'system',
                name: () => $gettext('System'),
                redirect: 'system/about',
                meta: {
                    icon: InfoCircleOutlined
                },
                children: [{
                    path: 'about',
                    name: () => $gettext('About'),
                    component: () => import('@/views/system/About.vue')
                }]
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        name: () => $gettext('Not Found'),
        component: () => import('@/views/other/Error.vue'),
        meta: {noAuth: true, status_code: 404, error: () => $gettext('Not Found')}
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    // @ts-ignore
    routes: routes
})

NProgress.configure({showSpinner: false})

router.beforeEach((to, from, next) => {
    // @ts-ignore
    next()
})

router.afterEach(() => {
    NProgress.done()
})

export default router
