<template>
<div class="min-h-screen p-8 bg-gray-100">

<h1 class="mb-8 text-3xl font-bold">
Edit Dormitory
</h1>

<div class="p-8 bg-white shadow rounded-2xl">

<!-- BASIC INFO -->

<div class="grid grid-cols-2 gap-6">

<div>
<label class="block mb-1 text-sm font-medium">
Dormitory Name
</label>

<input
v-model="form.name"
class="input"
/>
</div>

<div>
<label class="block mb-1 text-sm font-medium">
Type
</label>

<select
v-model="form.type"
class="input"
>

<option>Male</option>
<option>Female</option>
<option>Mixed</option>

</select>
</div>

<div class="col-span-2">

<label class="block mb-1 text-sm font-medium">
Address
</label>

<input
v-model="form.address"
class="input"
/>

</div>

</div>


<!-- SAVE BUTTON -->

<div class="mt-6">

<button
@click="updateDormitory"
class="btn-primary"
>

Save Changes

</button>

</div>

</div>


<!-- IMAGE MANAGEMENT -->

<div class="p-8 mt-8 bg-white shadow rounded-2xl">

<h2 class="mb-4 text-lg font-semibold">
Dormitory Images
</h2>


<!-- UPLOAD -->

<div
class="p-6 mb-6 text-center border-2 border-dashed rounded cursor-pointer hover:bg-gray-50"
@dragover.prevent
@drop.prevent="handleDrop"
>

<p class="text-sm text-gray-500">

Drag & Drop images here

</p>

<input
type="file"
multiple
accept="image/*"
class="hidden"
ref="fileInput"
@change="handleUpload"
/>

<button
class="px-4 py-2 mt-2 text-white bg-blue-600 rounded"
@click="openFilePicker"
>

Upload Images

</button>

</div>


<!-- IMAGE GRID -->

<div class="grid grid-cols-6 gap-4">

<div
v-for="img in dormitory.images"
:key="img.id"
class="relative"
>

<img
:src="img.imageUrl"
class="object-cover w-full h-24 rounded"
/>

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


interface DormImage {

id:number
imageUrl:string

}

interface Dormitory {

id:number
name:string
address:string
type:string
images:DormImage[]

}


const route = useRoute()

const dormId = Number(route.params.id)


const dormitory = ref<Dormitory>({
id:0,
name:"",
address:"",
type:"",
images:[]
})


const form = reactive({

name:"",
address:"",
type:""

})


const fileInput = ref<HTMLInputElement | null>(null)


/* ================= FETCH ================= */

const fetchDormitory = async()=>{

const {data} = await api.get(`/dormitories/${dormId}`)

dormitory.value = data

form.name = data.name
form.address = data.address
form.type = data.type

}


/* ================= UPDATE ================= */

const updateDormitory = async()=>{

await api.patch(`/dormitories/${dormId}`,form)

alert("Dormitory updated")

}


/* ================= UPLOAD ================= */

const openFilePicker = ()=>{

fileInput.value?.click()

}


const handleUpload = async(e:Event)=>{

const target = e.target as HTMLInputElement

if(!target.files?.length) return

const files = Array.from(target.files)

for(const file of files){

const formData = new FormData()

formData.append("image",file)

await api.post(
`/dormitories/${dormId}/images`,
formData,
{
headers:{
"Content-Type":"multipart/form-data"
}
}
)

}

fetchDormitory()

}


/* ================= DRAG DROP ================= */

const handleDrop = async(e:DragEvent)=>{

const files = Array.from(e.dataTransfer?.files || [])

if(!files.length) return

for(const file of files){

const formData = new FormData()

formData.append("image",file)

await api.post(
`/dormitories/${dormId}/images`,
formData,
{
headers:{
"Content-Type":"multipart/form-data"
}
}
)

}

fetchDormitory()

}


/* ================= DELETE ================= */

const deleteImage = async(id:number)=>{

await api.delete(`/dormitories/images/${id}`)

fetchDormitory()

}


/* ================= MOUNT ================= */

onMounted(()=>{

fetchDormitory()

})

</script>


<style scoped>

.input{

@apply w-full px-3 py-2 border rounded;

}

.btn-primary{

@apply px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700;

}

</style>