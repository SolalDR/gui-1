import { html, css, property, query, TemplateResult } from 'lit-element'
import { FileField, FileFieldParameters, FileFieldFormats } from '~/fields/file-field'
import { define } from '~/utils/decorators'

export interface ImageFieldParameters<
  Format extends keyof FileFieldFormats = 'url'
> extends FileFieldParameters<Format> {

}

@define('image-field') export class ImageField<
  Format extends keyof FileFieldFormats = 'url'
> extends FileField<Format> {
  @property({ type: String, attribute: false }) protected thumbnail?: string

  public static styles = css`
    ${FileField.styles}

    :host {
      display: block;
    }

    figure {
      width: calc(100% - calc(2 * var(--padding)));
      height: 60px;
      margin-top: var(--padding);
      margin-left: var(--padding);
      margin-right: var(--padding);
      margin-bottom: 0;
      border: 1px solid var(--primary-background);
      border-radius: 4px;
      box-sizing: border-box;
      display: block;
      flex-grow: 0;
      flex-shrink: 0;
      position: relative;
      transition: .2s;
    }

    figure::before {
      content: 'Image';
      background-color: var(--primary-background);
      width: 100%;
      height: 100%;
      opacity: 0.4;
      z-index: -1;
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--secondary-foreground);
      transition: .2s;
    }

    :host(:active) figure {
      border-color: var(--tint);
      transition: 0;
    }

    :host(:active) figure::before {
      color: var(--tint);
      transition: 0;
    }

    img {
      width: 100%;
      height: 100%;
      border-radius: 4px;
      object-fit: cover;
    }

    div {
      display: flex;
      align-items: center;
    }
  `

  public constructor(parameters: ImageFieldParameters<Format> = {}) {
    super({ ...parameters, accept: 'image/*' })
  }

  public set(value: FileFieldFormats[Format] | undefined): this {
    if (this.thumbnail) {
      URL.revokeObjectURL(this.thumbnail)
      this.thumbnail = undefined
    }

    if (typeof value === 'string') {
      this.thumbnail = value
    } else if (value instanceof Blob || value instanceof File) {
      this.thumbnail = URL.createObjectURL(value)
    }

    return super.set(value)
  }

  public render(): TemplateResult {
    return html`
      <figure>
        ${this.thumbnail ? html`<img .src=${this.thumbnail}>` : ''}
      </figure>
      <div>
        ${super.render()}
      </div>
    `
  }

  public static match(parameters: Record<string, any>): boolean {
    const value = parameters.value as File
    return (value &&
      (typeof value === 'string' && /\.(png|jpe?g|gif|svg)$/i.test(value)) ||
      (super.match(parameters) && value.type.slice(0, 6) === 'image/')
    )
  }
}
