<script setup lang="ts">
import {useGettext} from 'vue3-gettext'
import ws from '@/lib/websocket'
import {computed, nextTick, onMounted, onUnmounted, reactive, ref, watch} from 'vue'
import ReconnectingWebSocket from 'reconnecting-websocket'
import {useRoute, useRouter} from 'vue-router'
import FooterToolBar from '@/components/FooterToolbar/FooterToolBar.vue'
import nginx_log from '@/api/nginx_log'
import {debounce} from 'lodash'

const {$gettext} = useGettext()

const logContainer = ref(null)

let websocket: ReconnectingWebSocket | WebSocket
const route = useRoute()

function logType() {
    return route.path.indexOf('access') > 0 ? 'access' : route.path.indexOf('error') > 0 ? 'error' : 'site'
}

const control = reactive({
    type: logType(),
    conf_name: route.query.conf_name,
    server_idx: parseInt(route.query.server_idx as string),
    directive_idx: parseInt(route.query.directive_idx as string)
})

function openWs() {
    websocket = ws('/api/nginx_log')

    websocket.onopen = () => {
        websocket.send(JSON.stringify({
            ...control
        }))
    }

    websocket.onmessage = (m: any) => {
        addLog(m.data + '\n')
    }
}

function addLog(data: string, prepend: boolean = false) {
    // const para = document.createElement('p')
    // para.appendChild(document.createTextNode(data.trim()))
    //
    // const node = (logContainer.value as any as Node)

    if (prepend) {
        buffer.value = data + buffer.value
    } else {
        buffer.value += data
    }
    nextTick(() => {
        const elem = (logContainer.value as any as Element)
        elem?.scroll({
            top: elem.scrollHeight,
            left: 0
        })
    })
}

const buffer = ref('')

const page = ref(0)

function init() {
    nginx_log.page(0, {
        conf_name: (route.query.conf_name as string),
        type: logType(),
        server_idx: parseInt(route.query.server_idx as string),
        directive_idx: parseInt(route.query.directive_idx as string)
    }).then(r => {
        page.value = r.page - 1
        addLog(r.content)
    })
}

onMounted(() => {
    init()
    openWs()
})

const auto_refresh = ref(true)

watch(auto_refresh, (value) => {
    if (value) {
        openWs();
        (logContainer.value as any as Element).innerHTML = ''

    } else {
        websocket.close()
    }
})

watch(route, () => {
    init()

    control.type = logType();
    (logContainer.value as any as Element).innerHTML = ''

    nextTick(() => {
        websocket.send(JSON.stringify(control))
    })
})

watch(control, () => {
    (logContainer.value as any as Element).innerHTML = ''
    auto_refresh.value = true

    nextTick(() => {
        websocket.send(JSON.stringify(control))
    })
})

onUnmounted(() => {
    websocket.close()
})

const router = useRouter()
const loading = ref(false)

function on_scroll_log() {
    if (!loading.value && page.value > 0) {
        loading.value = true
        const elem = (logContainer.value as any as Element)
        if (elem?.scrollTop / elem?.scrollHeight < 0.333) {
            nginx_log.page(page.value, {
                conf_name: (route.query.conf_name as string),
                type: logType(),
                server_idx: 0,
                directive_idx: 0
            }).then(r => {
                page.value = r.page - 1
                addLog(r.content, true)
            }).finally(() => {
                loading.value = false
            })
        } else {
            loading.value = false
        }
    }
}

const filter = ref('')

const computedBuffer = computed(() => {
    if (filter.value) {
        return buffer.value.split('\n').filter(line => line.match(filter.value)).join('\n')
    }
    return buffer.value
})
</script>

<template>
    <a-card :title="$gettext('Nginx Log')" :bordered="false">
        <a-form layout="vertical">
            <a-form-item :label="$gettext('Auto Refresh')">
                <a-switch v-model:checked="auto_refresh"/>
            </a-form-item>
            <a-form-item :label="$gettext('Filter')">
                <a-input v-model:value="filter" style="max-width: 300px"/>
            </a-form-item>
        </a-form>

        <a-card>
            <pre class="nginx-log-container" ref="logContainer"
                 @scroll="debounce(on_scroll_log,100, null)()" v-html="computedBuffer"/>
        </a-card>
        <footer-tool-bar v-if="control.type==='site'">
            <a-button @click="router.go(-1)">
                <translate>Back</translate>
            </a-button>
        </footer-tool-bar>
    </a-card>
</template>

<style lang="less">
.nginx-log-container {
    height: 60vh;
    overflow: scroll;
    padding: 5px;
    margin-bottom: 0;

    font-size: 12px;
    line-height: 2;
}
</style>
