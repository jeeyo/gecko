{{/*
Expand the name of the chart.
*/}}
{{- define "gecko.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "gecko.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart label.
*/}}
{{- define "gecko.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels.
*/}}
{{- define "gecko.labels" -}}
helm.sh/chart: {{ include "gecko.chart" . }}
{{ include "gecko.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels.
*/}}
{{- define "gecko.selectorLabels" -}}
app.kubernetes.io/name: {{ include "gecko.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
ServiceAccount name.
*/}}
{{- define "gecko.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "gecko.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
DATABASE_URL env source.
Produces a single `valueFrom` or (for bundled) `value` entry.
*/}}
{{- define "gecko.databaseUrlEnv" -}}
{{- if .Values.postgres.bundled.enabled }}
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: {{ printf "%s-postgres" (include "gecko.fullname" .) }}
      key: DATABASE_URL
{{- else }}
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: {{ required "postgres.external.secretName is required when bundled is disabled" .Values.postgres.external.secretName }}
      key: {{ .Values.postgres.external.secretKey | default "DATABASE_URL" }}
{{- end }}
{{- end }}

{{/*
Postgres host used by the migration init-container for pg_isready.
*/}}
{{- define "gecko.dbHost" -}}
{{- if .Values.postgres.bundled.enabled }}
{{- printf "%s-postgres" (include "gecko.fullname" .) }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Web origin (used for CORS on the API).
*/}}
{{- define "gecko.webOrigin" -}}
{{- if .Values.api.env.webOrigin }}
{{- .Values.api.env.webOrigin }}
{{- else if .Values.ingress.enabled }}
{{- $scheme := "http" }}
{{- if .Values.ingress.tls }}{{- $scheme = "https" }}{{- end }}
{{- printf "%s://%s" $scheme .Values.ingress.host }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Google redirect URI.
*/}}
{{- define "gecko.googleRedirectUri" -}}
{{- if .Values.google.redirectUri }}
{{- .Values.google.redirectUri }}
{{- else if .Values.ingress.enabled }}
{{- $scheme := "http" }}
{{- if .Values.ingress.tls }}{{- $scheme = "https" }}{{- end }}
{{- printf "%s://%s/api/auth/google/callback" $scheme .Values.ingress.host }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

