<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { FetchResponse } from 'ofetch'
import { usePrecognitionForm, useNuxtFormValidator } from '#imports'

type LoginForm = {
  name: string
  email: string
  password: string
  password_confirmation: string
}

const payload: LoginForm = {
  name: 'John Doe',
  email: '',
  password: '',
  password_confirmation: '',
}

const form = usePrecognitionForm<LoginForm>('post', '/register', payload)
const validator = useNuxtFormValidator(form)
const state: LoginForm = form.fields

const nuxtForm = useTemplateRef('nuxt-form')

const reset = () => {
  form.reset()
}

const validate = () => {
  nuxtForm.value!.validate()
}

async function onSubmit(event: FormSubmitEvent<LoginForm>) {
  console.log('Trying to submit', event)

  try {
    const response = await form.submit()
    console.log('Form submitted', response)
  }
  catch (e) {
    const response = e as FetchResponse<unknown>
    console.error('Form error', response)
  }
}
</script>

<template>
  <UForm
    ref="nuxt-form"
    :validate="validator"
    :state="state"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField
      label="Name"
      name="name"
    >
      <div class="flex gap-2 items-end">
        <UInput
          v-model="state.name"
          placeholder="Name"
        />
        <UButton
          @click="nuxtForm!.clear('name')"
        >
          Clear value
        </UButton>
        <span>Touched: {{ form.touched('name') }}</span>
        <span>Valid: {{ form.valid('name') }}</span>
      </div>
    </UFormField>

    <UFormField
      label="Email"
      name="email"
    >
      <div class="flex gap-2 items-end">
        <UInput
          v-model="state.email"
          placeholder="Email"
        />
        <UButton
          @click="nuxtForm!.clear('email')"
        >
          Clear value
        </UButton>
        <span>Touched: {{ form.touched('email') }}</span>
        <span>Valid: {{ form.valid('email') }}</span>
      </div>
    </UFormField>

    <UFormField
      label="Password"
      name="password"
    >
      <div class="flex gap-2 items-end">
        <UInput
          v-model="state.password"
          placeholder="Password"
          type="password"
        />
        <UButton
          @click="nuxtForm!.clear('password')"
        >
          Clear value
        </UButton>
        <span>Touched: {{ form.touched('password') }}</span>
        <span>Valid: {{ form.valid('password') }}</span>
      </div>
    </UFormField>

    <UFormField
      label="Password confirmation"
      name="password_confirmation"
    >
      <div class="flex gap-2 items-end">
        <UInput
          v-model="state.password_confirmation"
          placeholder="Password confirmation"
          type="password"
        />
        <UButton
          @click="nuxtForm!.clear('password_confirmation')"
        >
          Clear value
        </UButton>
        <span>Touched: {{ form.touched('password_confirmation') }}</span>
        <span>Valid: {{ form.valid('password_confirmation') }}</span>
      </div>
    </UFormField>

    <UButtonGroup>
      <UButton type="submit">
        Submit
      </UButton>
      <UButton
        :disabled="form.validating"
        @click="validate"
      >
        Validate
      </UButton>
      <UButton
        :disabled="form.validating"
        @click="nuxtForm!.validate({ name: ['email', 'password'] })"
      >
        Validate Explicit
      </UButton>
      <UButton
        type="reset"
        @click="reset"
      >
        Clear
      </UButton>
    </UButtonGroup>
  </UForm>

  <div class="flex flex-col mt-4 gap-4">
    <div>
      <strong>Was Successful:</strong>
      <pre>{{ form.wasSuccessful }}</pre>
    </div>

    <div>
      <strong>Processing:</strong>
      <pre>{{ form.processing }}</pre>
    </div>

    <div>
      <strong>Validating:</strong>
      <pre>{{ form.validating }}</pre>
    </div>

    <div>
      <strong>Has Errors:</strong>
      <pre>{{ form.hasErrors }}</pre>
    </div>

    <div>
      <strong>Errors:</strong>
      <pre>{{ form.errors }}</pre>
    </div>

    <div>
      <strong>Fields:</strong>
      <pre>{{ form.data() }}</pre>
    </div>
  </div>
</template>
