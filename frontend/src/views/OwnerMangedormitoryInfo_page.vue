<template>
  <div class="min-h-screen p-8 bg-gray-100">
    <h1 class="mb-8 text-3xl font-bold">Edit Dormitory</h1>

    <div class="p-8 bg-white shadow rounded-2xl">
      <!-- BASIC INFO -->

      <div class="grid grid-cols-2 gap-6">
        <div>
          <label class="block mb-1 text-sm font-medium"> Dormitory Name </label>

          <input v-model="form.name" class="input" />
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium"> Type </label>

          <select v-model="form.type" class="input">
            <option>Male</option>
            <option>Female</option>
            <option>Mixed</option>
          </select>
        </div>

        <div class="col-span-2">
          <label class="block mb-1 text-sm font-medium"> Address </label>

          <input v-model="form.address" class="input" />
        </div>
      </div>

      <!-- SAVE BUTTON -->

      <div class="mt-6">
        <button @click="updateDormitory" class="btn-primary">Save Changes</button>
      </div>
    </div>

    <!-- IMAGE MANAGEMENT -->

    <div class="p-8 mt-8 bg-white shadow rounded-2xl">
      <h2 class="mb-4 text-lg font-semibold">Dormitory Images</h2>

      <!-- UPLOAD -->

      <div
        class="p-6 mb-6 text-center border-2 border-dashed rounded cursor-pointer hover:bg-gray-50"
        @dragover.prevent
        @drop.prevent="handleDrop"
      >
        <p class="text-sm text-gray-500">Drag & Drop images here</p>

        <input
          type="file"
          multiple
          accept="image/*"
          class="hidden"
          ref="fileInput"
          @change="handleUpload"
        />

        <button class="px-4 py-2 mt-2 text-white bg-blue-600 rounded" @click="openFilePicker">
          Upload Images
        </button>
      </div>

      <!-- IMAGE GRID -->

      <div class="grid grid-cols-6 gap-4">
        <div v-for="img in dormitory.images" :key="img.id" class="relative">
          <img :src="img.imageUrl" class="object-cover w-full h-24 rounded" />

          <button
            @click="deleteImage(img.id)"
            class="absolute px-1 text-white bg-red-500 rounded top-1 right-1"
          >
            x
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import { useRoute } from "vue-router"
import api from "@/services/api"

/* ================= TYPES ================= */

interface DormImage {
  id: number
  imageUrl: string
}

interface Dormitory {
  id: number
  name: string
  address: string
  type: string
  images: DormImage[]
}

/* ================= ROUTE ================= */

const route = useRoute()
const dormId = Number(route.params.id)

/* ================= STATE ================= */

const dormitory = ref<Dormitory>({
  id: 0,
  name: "",
  address: "",
  type: "",
  images: [],
})

const form = reactive({
  name: "",
  address: "",
  type: "",
})

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

/* ================= FETCH ================= */

const fetchDormitory = async () => {
  try {
    const { data } = await api.get(`/dormitories/${dormId}`)

    dormitory.value = data

    form.name = data.name
    form.address = data.address
    form.type = data.type
  } catch (err) {
    console.error("Fetch dormitory failed", err)
  }
}

/* ================= UPDATE INFO ================= */

const updateDormitory = async () => {
  try {
    await api.patch(`/dormitories/${dormId}`, form)

    alert("Dormitory updated")
  } catch (err) {
    console.error("Update failed", err)
  }
}

/* ================= FILE PICKER ================= */

const openFilePicker = () => {
  fileInput.value?.click()
}

/* ================= UPLOAD IMAGES ================= */

const uploadImages = async (files: File[]) => {
  if (!files.length) return

  uploading.value = true

  try {
    const formData = new FormData()

    files.forEach((file) => {
      formData.append("images", file) // IMPORTANT (ต้องเป็น images)
    })

    await api.post(`/dormitories/${dormId}/images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    await fetchDormitory()

  } catch (err) {
    console.error("Upload failed", err)
  } finally {
    uploading.value = false
  }
}

/* ================= FILE INPUT ================= */

const handleUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement

  if (!target.files) return

  const files = Array.from(target.files)

  uploadImages(files)
}

/* ================= DRAG DROP ================= */

const handleDrop = async (e: DragEvent) => {
  e.preventDefault()

  const files = Array.from(e.dataTransfer?.files || [])

  uploadImages(files)
}

/* ================= DELETE IMAGE ================= */

const deleteImage = async (id: number) => {
  try {
    await api.delete(`/dormitories/images/${id}`)

    await fetchDormitory()

  } catch (err) {
    console.error("Delete image failed", err)
  }
}

/* ================= MOUNT ================= */

onMounted(fetchDormitory)

</script>


<style scoped>
.input {
  @apply w-full px-3 py-2 border rounded;
}

.btn-primary {
  @apply px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700;
}
</style>