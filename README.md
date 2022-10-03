# confuser-cli-action
This Action downloads the latest ConfuserEx-CLI release and feeds a provided *.crproj file into it. The purpose of building this was to enhance our my build pipeline by building ready to release artifacts.

#### NOTE:
This Action is expected to use `runs-on: windows-latest` because the ConfuserEx CLI is based on the .Net Framework 4.6


## Inputs
`confuser-config` - *required* - One or more paths to a fully functional *.crproj files. Make sure this configuration is fully tested outside of a GH Action workflow first.


## Example
This is an example of how this could be used to save your confuser artifacts into another repo. Note that this example does assume you've got a private access token secret for some other repo that your building your releases into. However, GH Actions pretty much let you do anything. so there are lots of different ways and places the confuser artifacts could be stored.
```yaml
name: My Project
on:
  workflow_dispatch:

jobs:
  MyProject-CI:
    runs-on: windows-latest
    env:
      CSPROJ1: ${{ github.workspace }}\MyProject\MyProjectMain.csproj
      CSPROJ2: ${{ github.workspace }}\MyProject\MyProjectSupport.csproj
      CSPROJ3: ${{ github.workspace }}\MyProject\MyProjectTests.csproj
      CRPROJ1: ${{ github.workspace }}\MyProject\MyProjectMain.crproj
      CRPROJ2: ${{ github.workspace }}\MyProject\MyProjectSupport.crproj
      BUILDSREPO: ${{ github.workspace }}\Builds
    steps:
      - name: Set up Git SSH
        uses: webfactory/ssh-agent@v0.5.3
        with:
          ssh-private-key: ${{ secrets.BUILDS_ACCESS_KEY }}
      - name: Get Builds Project
        shell: bash
        run: |
          git clone ssh://git@github.com/Someone/SomeBuildsRepo.git '${{ env.BUILDSREPO }}'
      - uses: actions/checkout@v3
        with:
          path: .\MyProject
      - name: Setup .NET
        uses: actions/setup-dotnet@v2
        with:
          dotnet-version: 6.0.x
      - name: Restore Dependencies
        run: |
          dotnet restore "${{ env.CSPROJ1 }}"
          dotnet restore "${{ env.CSPROJ2 }}"
          dotnet restore "${{ env.CSPROJ3 }}"
      - name: Build All
        id: build-all
        run: |
          dotnet build "${{ env.CSPROJ1 }}" --no-restore --configuration Debug
          dotnet build "${{ env.CSPROJ2 }}" --no-restore --configuration Debug
          dotnet build "${{ env.CSPROJ3 }}" --no-restore --configuration Debug
          dotnet build "${{ env.CSPROJ1 }}" --no-restore --configuration Release
          dotnet build "${{ env.CSPROJ2 }}" --no-restore --configuration Release
      - name: Test
        id: run-tests
        run: |
          dotnet test "${{ env.CSPROJ3 }}" --logger "console;verbosity=normal" --no-build --no-restore --configuration Debug
      - name: ConfuserEx CLI Operation
        uses: JD-Howard/confuser-cli-action@main
        id: confuse-release
        if: steps.build-all.outcome == 'success' && steps.run-tests.outcome == 'success'
        with:
          confuser-config: |
            ${{ env.CRPROJ1 }}
            ${{ env.CRPROJ2 }}
      - name: Save Artifacts
        if: steps.confuse-release.outcome == 'success'
        run: |
          git config --global user.email "${{ github.actor }}@users.noreply.github.com"
          git config --global user.name ${{ github.actor }}
          git -C "${{ env.BUILDSREPO }}" commit -a -m "Automated Workflow"
          git -C "${{ env.BUILDSREPO }}" push
```