<script setup lang="ts">
import type { FetchResponse } from 'ofetch'
import { usePrecognitionForm } from '#imports'

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

const reset = () => {
  form.reset()
}

const validate = () => {
  form.validate([], {
    validateFiles: true,
    onSuccess: (response) => {
      console.log('Calling onSuccess(response)', response)
    },
    onError: (error) => {
      console.log('Calling onError(response)', error)
    },
    onValidationError: (response) => {
      console.log('Calling onValidationError(response)', response)
    },
  })
}

// Callback way
// const submit = () => form
//   .submit()
//   .then((response: FetchResponse<unknown>) => console.log('Form submitted', response))
//   .catch((error: FetchResponse<unknown>) => console.error('Form error', error))

// Async-Await way
async function submit() {
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
  <div class="flex flex-col gap-4">
    <div class="flex gap-2 items-end">
      <UFormField label="Name">
        <UInput
          v-model="form.fields.name"
          placeholder="Name"
          @change="form.validate('name')"
          @blur="form.touch('name')"
        />
      </UFormField>
      <div
        v-if="form.invalid('name')"
        class="text-error"
      >
        Error: {{ form.errors.name }}
      </div>
      <UButton
        @click="form.reset('name')"
      >
        Clear value
      </UButton>
      <span>Touched: {{ form.touched('email') }}</span>
      <span>Valid: {{ form.valid('email') }}</span>
    </div>

    <div class="flex gap-2 items-end">
      <UFormField label="Email">
        <UInput
          v-model="form.fields.email"
          placeholder="Email"
          @change="form.validate('email')"
          @blur="form.touch('email')"
        />
      </UFormField>
      <div
        v-if="form.invalid('email')"
        class="text-error"
      >
        Error: {{ form.errors.email }}
      </div>
      <UButton
        @click="form.reset('email')"
      >
        Clear value
      </UButton>
      <span>Touched: {{ form.touched('email') }}</span>
      <span>Valid: {{ form.valid('email') }}</span>
    </div>

    <div class="flex gap-2 items-end">
      <UFormField label="Password">
        <UInput
          v-model="form.fields.password"
          placeholder="Password"
          type="password"
          @change="form.validate(['password', 'password_confirmation'])"
          @blur="form.touch('password')"
        />
      </UFormField>
      <div
        v-if="form.invalid('password')"
        class="text-error"
      >
        Error: {{ form.errors.password }}
      </div>
      <UButton
        @click="form.reset('password')"
      >
        Clear value
      </UButton>
      <span>Touched: {{ form.touched('password') }}</span>
      <span>Valid: {{ form.valid('password') }}</span>
    </div>

    <div class="flex gap-2 items-end">
      <UFormField label="Password confirmation">
        <UInput
          v-model="form.fields.password_confirmation"
          placeholder="Password confirmation"
          type="password_confirmation"
          @change="form.validate(['password_confirmation', 'password'])"
          @blur="form.touch('password_confirmation')"
        />
      </UFormField>
      <div
        v-if="form.invalid('password_confirmation')"
        class="text-error"
      >
        Error: {{ form.errors.password_confirmation }}
      </div>
      <UButton
        @click="form.reset('password_confirmation')"
      >
        Clear value
      </UButton>
      <span>Touched: {{ form.touched('password_confirmation') }}</span>
      <span>Valid: {{ form.valid('password_confirmation') }}</span>
    </div>

    <UButtonGroup>
      <UButton
        :disabled="form.processing"
        @click="submit"
      >
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
        @click="form.validate(['email', 'password'])"
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

    <div>
      <strong>Was Successful:</strong>
      <pre>{{ form.wasSuccessful }}</pre>
    </div>

    <div>
      <strong>Recently Successful:</strong>
      <pre>{{ form.recentlySuccessful }}</pre>
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

<style>
</style>
