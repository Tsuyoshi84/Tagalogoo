---
fileMatchPattern: "app/components/**/*.spec.ts"
inclusion: fileMatch
---
# Rules for Vue Component tests

## Testing

- Focus on behavior, not implementation details
- Use Vue Testing Library APIs to interact with components.
- Mock global plugins (router, Pinia) as needed
- Query by role/name/label first (getByRole, findByLabelText). Avoid test IDs.
- Use `getRenderFn` defined in `app/test/helpers.ts` to render component.
- Prefer testing for rendered text, roles, accessibility attributes, and actual behaviors.
- Test for Tailwind classes only if they represent critical states or are public API for your component.
- Don't add an extra `expect` when using `getBy...` queries (e.g. `getByRole`, `getByLabelText`), since these already throw an error if the element is not found.
