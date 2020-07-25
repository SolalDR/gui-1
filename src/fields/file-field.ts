/**
 * ## File field
 *
 * ```
 * new GUI()
 *   .add({ value: new File([], 'foo.txt') }) // Auto detect
 *   .add({ value: new Blob([]) })
 *   .add({ value: new ReadableStream({  }) })
 *   .add({ field: 'file', value: '/foo.txt' }) // Specify field name
 *   // (implicit 'url' format for string values)
 *   .add({ field: 'file', value: 'foo bar', format: 'text' })
 *   .add({ field: new FileField() }) // Provide field instance
 * ```
 *
 * <br>
 *
 * #### Preview
 *
 * <br>
 *
 * <img alt="preview" src="../media/fields/file.png" width="300">
 *
 * @packageDocumentation
 */

import { html, css, property, query, TemplateResult } from 'lit-element'
import { Field, FieldParameters } from '~/field'
import { UpdateEvent } from '~/update-event'
import { define } from '~/utils/decorators'

export interface FileFieldFormats {
  file: File
  blob: Blob
  buffer: ArrayBuffer
  stream: ReadableStream
  text: string
  url: string
}

export interface FileFieldParameters<
  Format extends keyof FileFieldFormats = 'url'
> extends FieldParameters<
  FileFieldFormats[Format]
> {
  format?: Format
  accept?: string
}

@define('file-field') export class FileField<
  Format extends keyof FileFieldFormats = 'url'
> extends Field<
  FileFieldFormats[Format],
  FileFieldFormats[Format] | undefined,
  File | undefined
> {
  protected name: string = ''
  @query('input') protected $input!: HTMLInputElement
  @property({ type: String }) public format: Format
  @property({ type: String }) public accept?: string

  /**
   * @ignore
   */
  public static styles = css`
    ${Field.styles}

    :host {
      display: flex;
      align-items: center;
      position: relative;
    }

    span {
      width: 20px;
      height: 20px;
      margin-right: calc(var(--padding) - 3px);
      margin-left: auto;
      display: block;
      z-index: 3;
      position: relative;
      flex-grow: 0;
      flex-shrink: 0;
      cursor: pointer;
    }

    span::before, span::after {
      content: '';
      background-color: var(--secondary-foreground);
      width: 65%;
      height: 1px;
      top: 50%;
      left: 50%;
      position: absolute;
      transition: .2s;
    }

    span::before {
      transform: translate(-50%, -50%) rotate(45deg);
    }

    span::after {
      transform: translate(-50%, -50%) rotate(-45deg);
    }

    span:active::before, span:active::after {
      background-color: var(--tint);
      transition: 0;
    }

    p {
      padding: var(--padding);
      margin: 0;
      color: var(--secondary-foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    :host(:active) p {
      color: var(--tint);
      transition: 0;
    }

    input[type="file"] {
      width: 100%;
      height: 100%;
      padding: 0;
      top: 0;
      left: 0;
      opacity: 0;
      z-index: 2;
      cursor: pointer;
      position: absolute;
    }

    input[type="file"]::-webkit-file-upload-button {
      opacity: 0;
      width: 50%;
      height: 100%;
      top: 0;
      left: 0;
      border: none;
      border-radius: 0;
      margin: 0;
      padding: 0;
      z-index: 2;
      position: absolute;
      -webkit-appearance: none;
      appearance: none;
    }
  `

  public constructor(parameters?: FileFieldParameters<Format>)

  public constructor({
    value = undefined,
    format = (
      value instanceof File ? 'file' :
        value instanceof Blob ? 'blob' :
          value instanceof ArrayBuffer ? 'buffer' :
            value instanceof ReadableStream ? 'stream' : 'url'
    ) as Format,
    accept = value instanceof File || value instanceof Blob
      ? value.type.replace(/^(image|audio|video)\/.*$/, '$1/*') /**/
      : undefined,
    ...parameters
  }: FileFieldParameters<Format> = {}) {
    super(parameters)
    this.format = format
    this.accept = accept
    this.set(value)
  }

  protected extract(event: InputEvent): File {
    const files = (event.target as HTMLInputElement).files
    return files ? files[0] : null as unknown as File
  }

  protected parse(value: File | undefined): (
    FileFieldFormats[Format] |
    Promise<FileFieldFormats[Format]> |
    undefined
  ) {
    if (!value) return

    switch (this.format) {
      case 'url':
        return URL.createObjectURL(value) as FileFieldFormats[Format]

      case 'text':
        return value.text() as Promise<FileFieldFormats[Format]>

      case 'buffer':
        return value.arrayBuffer() as Promise<FileFieldFormats[Format]>

      case 'stream':
        return value.stream() as Promise<FileFieldFormats[Format]>
    }

    return value as FileFieldFormats[Format]
  }

  public set(value: FileFieldFormats[Format] | undefined): this {
    if (!value && this.$input) this.$input.value = ''

    if (value instanceof File) {
      this.name = (value as File).name
    } else if (typeof value === 'string') {
      this.name = value
    }

    if (!this.name) this.name = `Arbitrary ${this.format}`

    return super.set(value)
  }

  public clear(): void {
    const previous = this.value
    this.set(undefined)
    this.dispatchEvent(new UpdateEvent(this.value, previous))
  }

  /**
   * @ignore
   */
  public render(): TemplateResult {
    return html`
      <input
        type="file"
        .accept=${this.accept || ''}
        .disabled=${this.disabled}
        @change=${this.input}
      >

      <p>${this.value ? this.name : 'Choose a file'}</p>

      ${!this.value ? '' : html`<span
        @click=${this.clear}
      ></span>`}
    `
  }

  /**
   * @ignore
   */
  public static match({ value = undefined }: Record<string, any>): boolean {
    return (
      value instanceof Blob ||
      value instanceof ArrayBuffer ||
      value instanceof ReadableStream
    )
  }
}
