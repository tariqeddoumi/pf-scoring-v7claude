Attribute VB_Name = "modIA"
Option Explicit

' =====================================================================
'  Propositions de l'IA : import d'un fichier produit par l'outil web
'  (feuille « Propositions », format decrit dans l'onglet « Champs IA »).
'  Rien n'est ecrit dans le dossier sans acceptation : chaque proposition
'  passe par l'onglet « Revue IA » et chaque decision est tracee au Journal.
' =====================================================================

Private Const FEUILLE_PROPOSITIONS As String = "Propositions"
Private Const FORMAT_ATTENDU As String = "PF-PROPOSITIONS-IA v1"
Private Const REV_PREMIERE As Long = 9
Private Const COL_VALEUR As Long = 10   ' J : valeur convertie (masquee)
Private Const COL_TYPE As Long = 11     ' K : type du champ (masque)

Private Type Proposition
    Cle As String
    Valeur As Variant
    Source As String
    Confiance As String
End Type

Private mCodes(1 To 3) As String
Private mProps() As Proposition
Private mNb As Long

' ---------------------------------------------------------------------
'  Points d'entree
' ---------------------------------------------------------------------
Public Sub ImporterPropositionsIA()
    Dim ws As Worksheet, chemin As String
    Set ws = modOutil.DossierCible("Importer les propositions IA")
    If ws Is Nothing Then Exit Sub
    chemin = ChoisirFichier()
    If chemin = "" Then Exit Sub
    If Not LireFichier(chemin) Then Exit Sub
    PreparerRevue ws, chemin
End Sub

Public Sub NouveauDossierDepuisIA()
    Dim chemin As String, nom As String, ws As Worksheet
    chemin = ChoisirFichier()
    If chemin = "" Then Exit Sub
    If Not LireFichier(chemin) Then Exit Sub
    nom = mCodes(3)
    If nom = "" Then nom = "IA-" & mCodes(2)
    nom = Trim$(InputBox("Nom court du nouvel onglet :", "Nouveau dossier depuis l'IA", nom))
    If nom = "" Then Exit Sub
    If Not modOutil.NomValide(nom) Then Exit Sub
    Set ws = modOutil.CreerDossier(nom, "")
    If ws Is Nothing Then Exit Sub
    PreparerRevue ws, chemin
End Sub

' ---------------------------------------------------------------------
'  Lecture du fichier de propositions
' ---------------------------------------------------------------------
Private Function ChoisirFichier() As String
    Dim f As Variant
    f = Application.GetOpenFilename("Classeur Excel (*.xlsx;*.xlsm),*.xlsx;*.xlsm", , "Fichier de propositions de l'IA")
    If VarType(f) = vbBoolean Then Exit Function
    ChoisirFichier = CStr(f)
End Function

Private Function LireFichier(ByVal chemin As String) As Boolean
    Dim wbP As Workbook, wsP As Worksheet, r As Long, cle As String
    On Error GoTo Echec
    Application.ScreenUpdating = False
    Set wbP = Workbooks.Open(Filename:=chemin, ReadOnly:=True, UpdateLinks:=0, AddToMru:=False)
    On Error Resume Next
    Set wsP = wbP.Worksheets(FEUILLE_PROPOSITIONS)
    On Error GoTo Echec
    If wsP Is Nothing Then
        wbP.Close SaveChanges:=False
        Application.ScreenUpdating = True
        MsgBox "Le fichier ne contient pas de feuille « " & FEUILLE_PROPOSITIONS & " ».", vbExclamation, "Propositions IA"
        Exit Function
    End If
    If Left$(modOutil.Txt(wsP.Range("B1").Value), Len("PF-PROPOSITIONS-IA")) <> "PF-PROPOSITIONS-IA" Then
        wbP.Close SaveChanges:=False
        Application.ScreenUpdating = True
        MsgBox "Format non reconnu (cellule B1) : « " & FORMAT_ATTENDU & " » attendu.", vbExclamation, "Propositions IA"
        Exit Function
    End If
    mCodes(1) = modOutil.Txt(wsP.Range("B2").Value)
    mCodes(2) = NormaliserRadical(wsP.Range("B3").Value)
    mCodes(3) = UCase$(modOutil.Txt(wsP.Range("B4").Value))
    mNb = 0
    ReDim mProps(1 To 1)
    r = 9
    Do While modOutil.Txt(wsP.Cells(r, 1).Value) <> ""
        cle = modOutil.Txt(wsP.Cells(r, 1).Value)
        mNb = mNb + 1
        ReDim Preserve mProps(1 To mNb)
        mProps(mNb).Cle = cle
        If IsError(wsP.Cells(r, 2).Value) Then
            mProps(mNb).Valeur = Empty
        Else
            mProps(mNb).Valeur = wsP.Cells(r, 2).Value
        End If
        mProps(mNb).Source = modOutil.Txt(wsP.Cells(r, 3).Value)
        mProps(mNb).Confiance = modOutil.Txt(wsP.Cells(r, 4).Value)
        r = r + 1
    Loop
    wbP.Close SaveChanges:=False
    Application.ScreenUpdating = True
    If mCodes(1) = "" And mCodes(2) = "" And mCodes(3) = "" Then
        MsgBox "Le fichier ne porte ni code client, ni radical, ni code projet (cellules B2 à B4) : import refusé.", _
               vbExclamation, "Propositions IA"
        Exit Function
    End If
    If mNb = 0 Then
        MsgBox "Le fichier ne contient aucune proposition (à partir de la ligne 9).", vbExclamation, "Propositions IA"
        Exit Function
    End If
    LireFichier = True
    Exit Function
Echec:
    Application.ScreenUpdating = True
    MsgBox "Lecture du fichier impossible : " & Err.Description, vbExclamation, "Propositions IA"
End Function

Private Function NormaliserRadical(ByVal v As Variant) As String
    Dim s As String
    s = modOutil.Txt(v)
    If s <> "" And Len(s) < 7 And EstChiffres(s) Then s = Right$("0000000" & s, 7)
    NormaliserRadical = s
End Function

Private Function EstChiffres(ByVal s As String) As Boolean
    Dim i As Long
    If Len(s) = 0 Then Exit Function
    For i = 1 To Len(s)
        If Mid$(s, i, 1) < "0" Or Mid$(s, i, 1) > "9" Then Exit Function
    Next i
    EstChiffres = True
End Function

' ---------------------------------------------------------------------
'  Controle des codes et preparation de l'onglet « Revue IA »
' ---------------------------------------------------------------------
Private Sub PreparerRevue(ByVal ws As Worksheet, ByVal chemin As String)
    Dim wsR As Worksheet, libs As Variant, cellules As Variant, i As Long, cur As String, ecarts As String
    Dim controle As String, r As Long, k As Long, nbOk As Long, nbKo As Long, deja As Boolean

    libs = Array("code client T24", "radical", "code projet")
    cellules = Array(modOutil.CELLULE_CODE_CLIENT, modOutil.CELLULE_RADICAL, modOutil.CELLULE_CODE_PROJET)
    For i = 0 To 2
        cur = modOutil.Txt(ws.Range(cellules(i)).Value)
        If cur <> "" And mCodes(i + 1) <> "" And StrComp(cur, mCodes(i + 1), vbTextCompare) <> 0 Then
            ecarts = ecarts & "- " & libs(i) & " : dossier « " & cur & " », fichier « " & mCodes(i + 1) & " »" & vbCrLf
        End If
    Next i
    If ecarts <> "" Then
        MsgBox "Les codes du fichier ne correspondent pas à ceux du dossier « " & ws.Name & " » :" & vbCrLf & vbCrLf & _
               ecarts & vbCrLf & "Import refusé : vérifiez que le fichier concerne bien ce client et ce projet.", _
               vbCritical, "Propositions IA"
        modOutil.Journaliser "Import IA refusé", ws.Name, "Codes différents : " & Replace(ecarts, vbCrLf, " ")
        Exit Sub
    End If
    controle = "Codes conformes"
    For i = 0 To 2
        If modOutil.Txt(ws.Range(cellules(i)).Value) = "" Then controle = "Codes conformes ; codes vides du dossier proposés à la saisie"
    Next i

    Set wsR = ThisWorkbook.Worksheets(modOutil.ONGLET_REVUE)
    modOutil.Proteger wsR
    Application.ScreenUpdating = False
    r = REV_PREMIERE - 1 + Application.WorksheetFunction.CountA(wsR.Range("A" & REV_PREMIERE & ":A" & wsR.Rows.Count))
    If r >= REV_PREMIERE Then
        wsR.Range(wsR.Cells(REV_PREMIERE, 1), wsR.Cells(r, COL_TYPE)).Clear
    End If
    wsR.Range("B4").Value = "'" & ws.Name
    wsR.Range("B5").Value = "'" & chemin
    wsR.Range("B6").Value = controle
    wsR.Range("B7").Value = Format(Now, "dd/mm/yyyy hh:mm")

    r = REV_PREMIERE
    ' codes vides du dossier : proposes en tete, sauf s'ils figurent deja parmi les propositions
    For i = 0 To 2
        If modOutil.Txt(ws.Range(cellules(i)).Value) = "" And mCodes(i + 1) <> "" Then
            deja = False
            For k = 1 To mNb
                If StrComp(mProps(k).Cle, Array("code_client", "radical", "code_projet")(i), vbTextCompare) = 0 Then deja = True
            Next k
            If Not deja Then
                EcrireLigne wsR, r, ws, Array("code_client", "radical", "code_projet")(i), mCodes(i + 1), "Fichier de propositions (B" & (i + 2) & ")", "Élevée", nbOk, nbKo
                r = r + 1
            End If
        End If
    Next i
    For k = 1 To mNb
        EcrireLigne wsR, r, ws, mProps(k).Cle, mProps(k).Valeur, mProps(k).Source, mProps(k).Confiance, nbOk, nbKo
        r = r + 1
    Next k
    wsR.Columns(COL_VALEUR).Hidden = True
    wsR.Columns(COL_TYPE).Hidden = True
    Application.ScreenUpdating = True
    wsR.Activate
    wsR.Range("H" & REV_PREMIERE).Select
    modOutil.Journaliser "Import IA", ws.Name, (r - REV_PREMIERE) & " proposition(s) lue(s) dans " & chemin
    MsgBox (r - REV_PREMIERE) & " proposition(s) à examiner pour le dossier « " & ws.Name & " »." & vbCrLf & _
           nbOk & " préparée(s) pour acceptation, " & nbKo & " à rejeter (voir la colonne Remarque)." & vbCrLf & vbCrLf & _
           "Vérifiez chaque ligne, choisissez Accepter ou Rejeter en colonne H, puis cliquez « Appliquer les décisions ».", _
           vbInformation, "Propositions IA"
End Sub

' Une ligne de la revue : valeur actuelle, valeur proposee (en bleu), source, decision proposee.
Private Sub EcrireLigne(ByVal wsR As Worksheet, ByVal r As Long, ByVal ws As Worksheet, ByVal cle As String, _
                        ByVal valeur As Variant, ByVal source As String, ByVal confiance As String, _
                        ByRef nbOk As Long, ByRef nbKo As Long)
    Dim champ As Long, adr As String, typ As String, libelle As String, conv As Variant, remarque As String, ok As Boolean
    Dim actuel As String
    champ = LigneChamp(cle)
    wsR.Cells(r, 1).Value = "'" & cle
    wsR.Cells(r, 5).Value = "'" & modOutil.Txt(valeur)
    wsR.Cells(r, 5).Font.Color = RGB(0, 0, 255)
    wsR.Cells(r, 6).Value = "'" & source
    wsR.Cells(r, 7).Value = "'" & confiance
    If champ = 0 Then
        remarque = "Clé inconnue (voir l'onglet « Champs IA »)"
    Else
        libelle = modOutil.Txt(Plage("IA_Champs").Cells(champ, 2).Value)
        adr = modOutil.Txt(Plage("IA_Champs").Cells(champ, 3).Value)
        typ = modOutil.Txt(Plage("IA_Champs").Cells(champ, 4).Value)
        wsR.Cells(r, 2).Value = "'" & libelle
        wsR.Cells(r, 3).Value = "'" & adr
        actuel = modOutil.Txt(ws.Range(adr).Text)
        wsR.Cells(r, 4).Value = "'" & actuel
        ok = Convertir(typ, valeur, conv, remarque)
        If ok Then
            wsR.Cells(r, COL_VALEUR).Value = conv
            If VarType(conv) = vbString Then wsR.Cells(r, COL_VALEUR).Value = "'" & conv
            wsR.Cells(r, COL_TYPE).Value = "'" & typ
            If StrComp(modOutil.Txt(ws.Range(adr).Value), modOutil.Txt(conv), vbTextCompare) = 0 Then
                remarque = "Identique à la valeur actuelle"
                ok = False
            ElseIf actuel <> "" Then
                remarque = "Remplace une valeur saisie : à vérifier"
            End If
        End If
    End If
    With wsR.Cells(r, 8)
        .Value = IIf(ok, "Accepter", "Rejeter")
        .Locked = False
        .Interior.Color = RGB(255, 242, 204)
        .Validation.Delete
        .Validation.Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Formula1:="Accepter,Rejeter"
    End With
    wsR.Cells(r, 9).Value = remarque
    wsR.Range(wsR.Cells(r, 1), wsR.Cells(r, 9)).Borders.LineStyle = xlContinuous
    wsR.Range(wsR.Cells(r, 1), wsR.Cells(r, 9)).WrapText = True
    If ok Then nbOk = nbOk + 1 Else nbKo = nbKo + 1
End Sub

' Plage nommee du classeur de l'outil (et non du classeur actif). RefersToRange echoue
' dans certains tableurs quand le nom de la feuille contient une espace : on relit alors
' la reference ='Feuille'!$A$1:$B$2.
Private Function Plage(ByVal nom As String) As Range
    Dim ref As String, p As Long, rg As Range
    On Error Resume Next
    Set rg = ThisWorkbook.Names(nom).RefersToRange
    On Error GoTo 0
    If rg Is Nothing Then
        ref = Mid$(ThisWorkbook.Names(nom).RefersTo, 2)
        p = InStrRev(ref, "!")
        Set rg = ThisWorkbook.Worksheets(Replace(Left$(ref, p - 1), "'", "")).Range(Mid$(ref, p + 1))
    End If
    Set Plage = rg
End Function

Private Function LigneChamp(ByVal cle As String) As Long
    Dim i As Long, champs As Range
    Set champs = Plage("IA_Champs")
    For i = 1 To champs.Rows.Count
        If StrComp(modOutil.Txt(champs.Cells(i, 1).Value), cle, vbTextCompare) = 0 Then
            LigneChamp = i
            Exit Function
        End If
    Next i
End Function

' ---------------------------------------------------------------------
'  Conversion et controle d'une valeur proposee selon le type du champ
' ---------------------------------------------------------------------
Private Function Convertir(ByVal typ As String, ByVal v As Variant, ByRef res As Variant, ByRef remarque As String) As Boolean
    Dim s As String, x As Double, nomListe As String, c As Range
    s = modOutil.Txt(v)
    If s = "" Then
        remarque = "Valeur vide"
        Exit Function
    End If
    If Left$(typ, 6) = "liste:" Then
        nomListe = Mid$(typ, 7)
        For Each c In Plage(nomListe).Cells
            If StrComp(modOutil.Txt(c.Value), s, vbTextCompare) = 0 Then
                res = c.Value
                Convertir = True
                Exit Function
            End If
        Next c
        remarque = "Valeur hors de la liste admise"
        Exit Function
    End If
    Select Case typ
        Case "nombre"
            If EnNombre(v, x) Then
                res = x: Convertir = True
            Else
                remarque = "Nombre attendu"
            End If
        Case "pourcentage"
            If EnNombre(v, x) Then
                If Right$(s, 1) = "%" Then x = x / 100
                If x < 0 Or x > 5 Then
                    remarque = "Pourcentage attendu en fraction (0,15 pour 15 %)"
                Else
                    res = x: Convertir = True
                End If
            Else
                remarque = "Pourcentage attendu (0,15 pour 15 %)"
            End If
        Case "radical"
            s = NormaliserRadical(v)
            If Len(s) = 7 And EstChiffres(s) Then
                res = s: Convertir = True
            Else
                remarque = "Le radical compte exactement 7 chiffres"
            End If
        Case "codeprojet"
            s = UCase$(s)
            If s Like "PF-####-####" Then
                res = s: Convertir = True
            Else
                remarque = "Format PF-AAAA-NNNN attendu"
            End If
        Case "code"
            If Len(s) <= 20 Then
                res = s: Convertir = True
            Else
                remarque = "20 caractères au plus"
            End If
        Case "situation"
            If Niveau(s) > 0 Then
                res = s: Convertir = True
            Else
                remarque = "Niveau attendu : Très favorable, Favorable, Vigilance, Critique ou Info. insuffisante"
            End If
        Case "texte ou nombre"
            If EnNombre(v, x) Then res = x Else res = s
            Convertir = True
        Case Else
            res = s: Convertir = True
    End Select
End Function

Private Function EnNombre(ByVal v As Variant, ByRef x As Double) As Boolean
    Dim s As String
    If IsError(v) Or IsEmpty(v) Then Exit Function
    Select Case VarType(v)
        Case vbDouble, vbSingle, vbInteger, vbLong, vbCurrency, vbDecimal
            x = CDbl(v): EnNombre = True: Exit Function
    End Select
    s = Replace(Replace(Trim$(CStr(v)), " ", ""), Chr$(160), "")
    If Right$(s, 1) = "%" Then s = Left$(s, Len(s) - 1)
    s = Replace(s, ",", ".")
    If s = "" Or s Like "*[!0-9.+-]*" Then Exit Function
    If Len(s) - Len(Replace(s, ".", "")) > 1 Then Exit Function
    x = Val(s)
    EnNombre = True
End Function

' Rang du niveau (1 Tres favorable ... 4 Critique, 5 Info. insuffisante), 0 si non reconnu.
Private Function Niveau(ByVal s As String) As Long
    Dim t As String
    t = LCase$(Trim$(s))
    If Left$(t, 14) = "très favorable" Or Left$(t, 14) = "tres favorable" Then
        Niveau = 1
    ElseIf Left$(t, 9) = "favorable" Then
        Niveau = 2
    ElseIf Left$(t, 9) = "vigilance" Then
        Niveau = 3
    ElseIf Left$(t, 8) = "critique" Then
        Niveau = 4
    ElseIf Left$(t, 4) = "info" Then
        Niveau = 5
    End If
End Function

' ---------------------------------------------------------------------
'  Application des decisions
' ---------------------------------------------------------------------
Public Sub AppliquerPropositionsIA()
    Dim wsR As Worksheet, ws As Worksheet, nom As String, r As Long, passe As Long, typ As String
    Dim nbA As Long, nbR As Long, dec As String, adr As String, ancien As String, v As Variant, idx As Variant
    Set wsR = ThisWorkbook.Worksheets(modOutil.ONGLET_REVUE)
    nom = modOutil.Txt(wsR.Range("B4").Value)
    If nom = "" Or Not modOutil.FeuilleExiste(nom) Then
        MsgBox "Aucune revue en cours : lancez d'abord « Importer les propositions IA ».", vbExclamation, "Propositions IA"
        Exit Sub
    End If
    Set ws = ThisWorkbook.Worksheets(nom)
    If Not modOutil.EstDossier(ws) Then
        MsgBox "« " & nom & " » n'est pas un onglet de dossier.", vbExclamation, "Propositions IA"
        Exit Sub
    End If
    If MsgBox("Appliquer les décisions au dossier « " & nom & " » ?" & vbCrLf & _
              "Les lignes « Accepter » seront écrites dans le dossier ; toutes les décisions sont tracées au Journal.", _
              vbYesNo + vbQuestion, "Propositions IA") <> vbYes Then Exit Sub

    On Error GoTo Echec
    Application.EnableEvents = False
    Application.ScreenUpdating = False
    modOutil.Proteger ws
    modOutil.Proteger wsR
    ' Passe 1 : tous les champs sauf les situations ; passe 2 : les situations, une fois le
    ' secteur ecrit (la description de D2.1, D4.1, D4.3 et D5.2 depend du secteur).
    For passe = 1 To 2
        If passe = 2 Then Application.Calculate
        r = REV_PREMIERE
        Do While modOutil.Txt(wsR.Cells(r, 1).Value) <> ""
            typ = modOutil.Txt(wsR.Cells(r, COL_TYPE).Value)
            dec = modOutil.Txt(wsR.Cells(r, 8).Value)
            If (passe = 1) = (typ <> "situation") Then
                adr = modOutil.Txt(wsR.Cells(r, 3).Value)
                If dec = "Accepter" And adr <> "" And typ <> "" Then
                    ancien = modOutil.Txt(ws.Range(adr).Text)
                    v = wsR.Cells(r, COL_VALEUR).Value
                    If typ = "situation" Then
                        idx = ws.Cells(ws.Range(adr).Row, 13).Value
                        If IsNumeric(idx) And Not IsEmpty(idx) Then
                            v = Plage("R_Opts").Cells(CLng(idx), Niveau(CStr(v))).Value
                        End If
                    End If
                    ws.Range(adr).Value = v
                    ws.Range(adr).ClearComments
                    ws.Range(adr).AddComment "Proposition IA acceptée le " & Format(Now, "dd/mm/yyyy") & vbLf & _
                        "Source : " & modOutil.Txt(wsR.Cells(r, 6).Value) & vbLf & _
                        "Confiance : " & modOutil.Txt(wsR.Cells(r, 7).Value)
                    modOutil.Journaliser "IA acceptée", nom, modOutil.Txt(wsR.Cells(r, 1).Value) & " : « " & ancien & _
                        " » -> « " & modOutil.Txt(ws.Range(adr).Text) & " » (" & modOutil.Txt(wsR.Cells(r, 6).Value) & ")"
                    wsR.Cells(r, 8).Value = "Appliquée"
                    nbA = nbA + 1
                ElseIf dec = "Rejeter" Then
                    modOutil.Journaliser "IA rejetée", nom, modOutil.Txt(wsR.Cells(r, 1).Value) & " : « " & _
                        modOutil.Txt(wsR.Cells(r, 5).Value) & " » (" & modOutil.Txt(wsR.Cells(r, 9).Value) & ")"
                    wsR.Cells(r, 8).Value = "Rejetée"
                    nbR = nbR + 1
                End If
            End If
            r = r + 1
        Loop
    Next passe
    Application.EnableEvents = True
    Application.ScreenUpdating = True
    Application.Calculate
    modOutil.MajSynthese False
    ws.Activate
    MsgBox nbA & " proposition(s) appliquée(s), " & nbR & " rejetée(s)." & vbCrLf & vbCrLf & _
           "Les cellules alimentées portent un commentaire indiquant la source. Complétez les cellules orange, " & _
           "puis « Contrôler la saisie ».", vbInformation, "Propositions IA"
    Exit Sub
Echec:
    Application.EnableEvents = True
    Application.ScreenUpdating = True
    MsgBox "Application interrompue (ligne " & r & ") : " & Err.Description, vbExclamation, "Propositions IA"
End Sub
