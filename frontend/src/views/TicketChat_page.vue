<template>
  <div class="min-h-screen p-8 bg-gray-50">

    <div class="max-w-4xl mx-auto">

      <!-- HEADER -->

      <div class="p-6 mb-6 bg-white shadow rounded-xl">

        <div class="flex items-center justify-between">

          <div>

            <h1 class="text-xl font-bold">
              {{ ticket?.title }}
            </h1>

            <p class="text-sm text-gray-500">
              Room {{ ticket?.contract?.room?.roomNumber }}
            </p>

          </div>

          <span
            class="px-3 py-1 text-xs font-semibold rounded"
            :class="statusColor(ticket?.status)"
          >
            {{ ticket?.status }}
          </span>

        </div>

      </div>

      <!-- CHAT BOX -->

      <div class="flex flex-col bg-white shadow rounded-xl h-[500px]">

        <!-- MESSAGES -->

        <div
          ref="chatBox"
          class="flex-1 p-6 space-y-4 overflow-y-auto"
        >

          <div
            v-for="msg in messages"
            :key="msg.id"
            class="flex"
            :class="isMe(msg.senderId) ? 'justify-end' : 'justify-start'"
          >

            <div
              class="max-w-xs px-4 py-2 text-sm rounded-lg"
              :class="isMe(msg.senderId)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200'"
            >

              {{ msg.message }}

              <div class="mt-1 text-[10px] opacity-60">
                {{ formatTime(msg.createdAt) }}
              </div>

            </div>

          </div>

        </div>

        <!-- INPUT -->

        <div class="flex gap-3 p-4 border-t">

          <input
            v-model="newMessage"
            type="text"
            placeholder="Type message..."
            class="flex-1 input"
            @keyup.enter="sendMessage"
          />

          <button
            @click="sendMessage"
            :disabled="sending"
            class="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Send
          </button>

        </div>

      </div>

    </div>

  </div>
</template>

<script setup lang="ts">

import { ref, onMounted, nextTick } from "vue"
import { useRoute } from "vue-router"
import api from "@/services/api"

/* ================= ROUTE ================= */

const route = useRoute()

const ticketId = Number(route.params.ticketId)

/* ================= STATE ================= */

const ticket = ref<any>(null)
const messages = ref<any[]>([])

const newMessage = ref("")
const sending = ref(false)

const chatBox = ref<HTMLDivElement | null>(null)

const currentUser = JSON.parse(
  localStorage.getItem("user") || "null"
)

/* ================= FETCH TICKET ================= */

const fetchTicket = async () => {

  try {

    const res = await api.get(
      `/support/tickets/${ticketId}`
    )

    ticket.value = res.data

    messages.value = res.data.messages || []

    await nextTick()

    scrollBottom()

  } 
  catch (error) {

    console.error("Fetch ticket error:", error)

  }

}

/* ================= SEND MESSAGE ================= */

const sendMessage = async () => {

  if (!newMessage.value.trim()) return

  try {

    sending.value = true

    const res = await api.post(
      `/support/tickets/${ticketId}/messages`,
      {
        message: newMessage.value
      }
    )

    messages.value.push(res.data)

    newMessage.value = ""

    await nextTick()

    scrollBottom()

  } 
  catch (error) {

    console.error("Send message error:", error)

  } 
  finally {

    sending.value = false

  }

}

/* ================= UTIL ================= */

const isMe = (senderId: number) => {

  return senderId === currentUser?.id

}

const scrollBottom = () => {

  if (chatBox.value) {

    chatBox.value.scrollTop =
      chatBox.value.scrollHeight

  }

}

const formatTime = (date: string) => {

  return new Date(date).toLocaleTimeString(
    "th-TH",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  )

}

const statusColor = (status: string) => {

  switch (status) {

    case "OPEN":
      return "bg-yellow-100 text-yellow-800"

    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800"

    case "RESOLVED":
      return "bg-green-100 text-green-800"

    case "CLOSED":
      return "bg-gray-100 text-gray-700"

    default:
      return "bg-gray-100 text-gray-700"

  }

}

/* ================= INIT ================= */

onMounted(fetchTicket)

</script>

<style scoped>

.input {
  @apply w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
}

</style>