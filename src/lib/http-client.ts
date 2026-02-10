// Cliente HTTP que automáticamente agrega headers de autenticación

export interface HttpClientOptions extends RequestInit {
  headers?: Record<string, string>
}

/**
 * Cliente HTTP que automáticamente agrega headers de autenticación
 * Usa la información del usuario guardada en localStorage
 */
export async function httpClient(
  url: string,
  options: HttpClientOptions = {}
): Promise<Response> {
  // Obtener usuario del localStorage
  const userStr = typeof window !== "undefined" ? localStorage.getItem("crm_user") : null
  const user = userStr ? JSON.parse(userStr) : null

  // Preparar headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  // Agregar headers de autenticación si el usuario existe
  if (user) {
    headers["x-user-id"] = String(user.id)
    headers["x-user-role"] = user.rol
    headers["x-user-name"] = user.nombre
  }

  // Hacer la petición
  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Si es 401 o 403, limpiar sesión
  if (response.status === 401 || response.status === 403) {
    // Notificar al contexto de auth que la sesión expiró
    const event = new CustomEvent("auth-error", { detail: { status: response.status } })
    window.dispatchEvent(event)
  }

  return response
}
