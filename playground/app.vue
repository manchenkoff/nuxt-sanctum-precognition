<script setup lang="ts">
import type { FetchResponse } from 'ofetch'
import { usePrecognitionForm } from '#imports'

type LoginForm = {
  email: string
  password: string
  remember_me?: boolean
}

const payload: LoginForm = {
  email: '',
  password: '',
  remember_me: false,
}

const form = usePrecognitionForm<LoginForm>('post', '/login', payload)

const reset = () => form.reset()
const validate = () => form.validate([], {
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
  <div class="container">
    <h1>Login form with Precognition</h1>

    <div class="row">
      <label for="email">Email</label>
      <input
        id="email"
        v-model="form.fields.email"
        type="email"
        @change="form.validate('email')"
        @blur="form.touch('email')"
      >
      <div v-if="form.invalid('email')">
        Error: {{ form.errors.email }}
      </div>
      <button
        @click="form.reset('email')"
      >
        Clear value
      </button>
      <span>Touched: {{ form.touched('email') }}</span>
      <span>Valid: {{ form.valid('email') }}</span>
    </div>

    <div class="row">
      <label for="password">Password</label>
      <input
        id="password"
        v-model="form.fields.password"
        type="password"
        @change="form.validate('password')"
        @blur="form.touch('password')"
      >
      <div v-if="form.invalid('password')">
        Error: {{ form.errors.password }}
      </div>
      <button
        @click="form.reset('password')"
      >
        Clear value
      </button>
      <span>Touched: {{ form.touched('password') }}</span>
      <span>Valid: {{ form.valid('password') }}</span>
    </div>

    <div class="row">
      <button
        :disabled="form.processing"
        @click="submit"
      >
        Submit
      </button>
      <button
        :disabled="form.validating"
        @click="validate"
      >
        Validate
      </button>
      <button
        :disabled="form.validating"
        @click="form.validate(['email', 'password'])"
      >
        Validate Explicit
      </button>
      <button
        type="reset"
        @click="reset"
      >
        Clear
      </button>
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
.container {
  display: flex;
  flex-direction: column;
  gap: 10px;

  label {
    width: 100px;
  }
}

.row {
  display: flex;
  gap: 10px;
}
</style>
